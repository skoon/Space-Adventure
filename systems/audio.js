// systems/audio.js
import { eventEmitter } from "./eventEmitter.js";

/**
 * Audio manager; uses HTMLAudioElement for each track.
 * Listens to combat events to adapt music and play SFX.
 */
export class AudioManager {
  constructor() {
    this.tracks = {
      ambient: new Audio("assets/audio/ambient_space.mp3"),
      combat: new Audio("assets/audio/combat_normal.mp3"),
      intense: new Audio("assets/audio/combat_intense.mp3"),
      boss: new Audio("assets/audio/boss_battle.mp3"),
    };
    // All tracks loop
    Object.values(this.tracks).forEach(t => (t.loop = true));

    this.sfx = {
      laser: new Audio("assets/audio/sfx_laser.mp3"),
      hit: new Audio("assets/audio/sfx_hit.mp3"),
      explosion: new Audio("assets/audio/sfx_explosion.mp3"),
      success: new Audio("assets/audio/sfx_success.mp3"),
      failure: new Audio("assets/audio/sfx_failure.mp3"),
      click: new Audio("assets/audio/sfx_click.mp3"),
      warp: new Audio("assets/audio/sfx_warp.mp3"),
    };

    this.current = null;
    this.voice = null;
    this.voiceClips = {};
    this.muted = false;
    this.volume = 1.0;
    this._fadeInterval = null;
    this._boundGestureHandler = null;
    this._eventHandlers = [];

    this._setupUserGestureListener();
    this._wireEvents();
  }

  _setupUserGestureListener() {
    if (typeof document === "undefined") return;

    this._boundGestureHandler = () => {
      if (!this.current) {
        this.playTrack("ambient");
      }
      this._removeGestureListener();
    };

    document.addEventListener("pointerdown", this._boundGestureHandler);
    document.addEventListener("keydown", this._boundGestureHandler);
  }

  _removeGestureListener() {
    if (typeof document !== "undefined" && this._boundGestureHandler) {
      document.removeEventListener("pointerdown", this._boundGestureHandler);
      document.removeEventListener("keydown", this._boundGestureHandler);
      this._boundGestureHandler = null;
    }
  }

  _safePlay(audio) {
    if (!audio) return;
    try {
      const res = audio.play();
      if (res && typeof res.catch === "function") {
        res.catch(() => {});
      }
    } catch (_) {
      // Tolerate environments where play() is not permitted or throws
    }
  }

  _wireEvents() {
    const register = (event, fn) => {
      eventEmitter.on(event, fn);
      this._eventHandlers.push([event, fn]);
    };

    register("combatStart", () => this.crossFade("combat"));
    register("combatIntense", () => this.crossFade("intense"));
    register("bossPhase", () => this.crossFade("boss"));
    register("combatEnd", () => this.crossFade("ambient"));

    register("playerAttack", () => this.playSFX("laser"));
    register("enemyAttack", () => this.playSFX("hit"));
    register("explosion", () => this.playSFX("explosion"));
  }

  playTrack(name) {
    if (this._fadeInterval) {
      clearInterval(this._fadeInterval);
      this._fadeInterval = null;
    }
    const t = this.tracks[name];
    if (!t) return;
    if (this.current && this.current !== t) {
      this.current.pause();
      this.current.currentTime = 0;
    }
    this.current = t;
    t.volume = this.muted ? 0 : this.volume;
    this._safePlay(t);
  }

  crossFade(name, durationMs = 800) {
    const newTrack = this.tracks[name];
    if (!newTrack) return;
    if (this.current === newTrack && !newTrack.paused) return;

    if (this._fadeInterval) {
      clearInterval(this._fadeInterval);
      this._fadeInterval = null;
    }

    const oldTrack = this.current;
    this.current = newTrack;

    const initialOldVolume = oldTrack ? oldTrack.volume : 0;
    newTrack.volume = 0;
    this._safePlay(newTrack);

    if (durationMs <= 0) {
      newTrack.volume = this.muted ? 0 : this.volume;
      if (oldTrack && oldTrack !== newTrack) {
        oldTrack.pause();
        oldTrack.currentTime = 0;
      }
      return;
    }

    const stepMs = 50;
    const totalSteps = Math.max(1, Math.floor(durationMs / stepMs));
    let currentStep = 0;

    this._fadeInterval = setInterval(() => {
      currentStep++;
      const progress = Math.min(1, currentStep / totalSteps);
      const targetVolume = this.muted ? 0 : this.volume;

      newTrack.volume = progress * targetVolume;

      if (oldTrack && oldTrack !== newTrack) {
        oldTrack.volume = (1 - progress) * initialOldVolume;
      }

      if (progress >= 1) {
        clearInterval(this._fadeInterval);
        this._fadeInterval = null;
        newTrack.volume = this.muted ? 0 : this.volume;
        if (oldTrack && oldTrack !== newTrack) {
          oldTrack.pause();
          oldTrack.currentTime = 0;
        }
      }
    }, stepMs);
  }

  playSFX(name) {
    const s = this.sfx[name];
    if (s) {
      s.currentTime = 0;
      s.volume = this.muted ? 0 : this.volume;
      this._safePlay(s);
    }
  }

  playVoice(speakerKey, clipId = 'greeting') {
    this.stopVoice();
    if (!speakerKey) return;
    const clipKey = `${speakerKey}_${clipId}`;
    if (!this.voiceClips[clipKey]) {
      this.voiceClips[clipKey] = new Audio(`assets/audio/voice/${speakerKey}_${clipId}.mp3`);
    }
    const audio = this.voiceClips[clipKey];
    this.voice = audio;
    try {
      audio.currentTime = 0;
    } catch (_) {}
    audio.volume = this.muted ? 0 : this.volume;
    this._safePlay(audio);
  }

  stopVoice() {
    if (this.voice) {
      try {
        this.voice.pause();
      } catch (_) {}
      this.voice = null;
    }
  }

  setVolume(v) {
    this.volume = v;
    if (this.current && !this.muted) {
      this.current.volume = v;
    }
    if (this.voice && !this.muted) {
      this.voice.volume = v;
    }
  }

  mute(flag = true) {
    this.muted = flag;
    if (this.current) {
      this.current.volume = flag ? 0 : this.volume;
    }
    if (this.voice) {
      this.voice.volume = flag ? 0 : this.volume;
    }
  }

  destroy() {
    this._removeGestureListener();
    if (this._fadeInterval) {
      clearInterval(this._fadeInterval);
      this._fadeInterval = null;
    }
    if (this.current) {
      this.current.pause();
    }
    this.stopVoice();
    if (this._eventHandlers) {
      for (const [event, fn] of this._eventHandlers) {
        if (typeof eventEmitter.off === "function") {
          eventEmitter.off(event, fn);
        }
      }
      this._eventHandlers = [];
    }
  }
}

let audioManagerInstance = null;

export function initAudio() {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}

export function getAudioManager() {
  return audioManagerInstance;
}

export function _resetAudioForTesting() {
  if (audioManagerInstance) {
    audioManagerInstance.destroy();
    audioManagerInstance = null;
  }
}
