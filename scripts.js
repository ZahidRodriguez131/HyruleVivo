document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navList = document.querySelector('[data-nav-list]');

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navList.classList.toggle('open');
    });
  }

  const video = document.getElementById('hyruleVideo');
  const playPauseBtn = document.getElementById('playPause');
  const muteBtn = document.getElementById('muteBtn');
  const volumeSlider = document.getElementById('volumeControl');
  const ccToggleBtn = document.getElementById('ccToggle');
  const adToggleBtn = document.getElementById('adToggle');

  let captionsTrack;
  let descriptionsTrack;
  let adEnabled = false;
  let adAudio = null;

  if (video) {
    try {
      adAudio = new Audio('ZeldaAudioDesc.wav');
      adAudio.preload = 'auto';
    } catch (error) {
      adAudio = null;
    }
  }

  const syncTrackReferences = () => {
    if (!video?.textTracks) return;
    const tracks = Array.from(video.textTracks);
    if (!captionsTrack) {
      captionsTrack = tracks.find((track) => track.kind === 'captions');
      if (captionsTrack) {
        captionsTrack.mode = 'showing';
        ccToggleBtn?.setAttribute('aria-pressed', 'true');
        if (ccToggleBtn) {
          ccToggleBtn.textContent = 'Desactivar CC';
        }
      }
    }
    if (!descriptionsTrack) {
      descriptionsTrack = tracks.find((track) => track.kind === 'descriptions');
      if (descriptionsTrack && !adEnabled) {
        descriptionsTrack.mode = 'disabled';
      }
    }
  };

  const updatePlayPauseLabel = () => {
    if (!video || !playPauseBtn) return;
    playPauseBtn.textContent = video.paused ? 'Reproducir' : 'Pausar';
  };

  const syncAdTiming = () => {
    if (!video || !adAudio) return;
    const delta = Math.abs(video.currentTime - adAudio.currentTime);
    if (delta > 0.25) {
      adAudio.currentTime = video.currentTime;
    }
  };

  const applyAdState = (enabled) => {
    if (!video) return;
    adEnabled = enabled;
    syncTrackReferences();
    if (adToggleBtn) {
      adToggleBtn.dataset.ad = enabled ? 'on' : 'off';
      adToggleBtn.textContent = enabled ? 'Desactivar audio descriptivo' : 'Activar audio descriptivo';
      adToggleBtn.setAttribute('aria-pressed', String(enabled));
    }
    if (descriptionsTrack) {
      descriptionsTrack.mode = enabled ? 'showing' : 'disabled';
    }
    if (!adAudio) return;
    adAudio.playbackRate = video.playbackRate;
    adAudio.volume = video.muted ? 0 : video.volume;
    if (enabled) {
      adAudio.currentTime = video.currentTime;
      if (video.paused) {
        adAudio.pause();
      } else {
        adAudio.play().catch(() => {});
      }
    } else {
      adAudio.pause();
    }
  };

  if (video) {
    syncTrackReferences();
    video.addEventListener('loadedmetadata', syncTrackReferences);
    applyAdState(false);

    playPauseBtn?.addEventListener('click', () => {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });

    video.addEventListener('play', () => {
      updatePlayPauseLabel();
      if (adEnabled && adAudio) {
        adAudio.currentTime = video.currentTime;
        adAudio.play().catch(() => {});
      }
    });

    video.addEventListener('pause', () => {
      updatePlayPauseLabel();
      adAudio?.pause();
    });

    muteBtn?.addEventListener('click', () => {
      video.muted = !video.muted;
      muteBtn.textContent = video.muted ? 'Activar sonido' : 'Silenciar';
      if (adAudio) {
        adAudio.volume = video.muted ? 0 : video.volume;
      }
    });

    volumeSlider?.addEventListener('input', (event) => {
      const value = Number(event.target.value);
      video.volume = value;
      if (adAudio && !video.muted) {
        adAudio.volume = value;
      }
    });

    video.addEventListener('volumechange', () => {
      if (adAudio) {
        adAudio.volume = video.muted ? 0 : video.volume;
      }
    });

    video.addEventListener('ratechange', () => {
      if (adAudio) {
        adAudio.playbackRate = video.playbackRate;
      }
    });

    video.addEventListener('timeupdate', () => {
      if (adEnabled) {
        syncAdTiming();
      }
    });

    video.addEventListener('seeking', () => {
      if (adEnabled && adAudio) {
        adAudio.currentTime = video.currentTime;
      }
    });

    ccToggleBtn?.addEventListener('click', () => {
      syncTrackReferences();
      if (!captionsTrack) return;
      const enabled = captionsTrack.mode === 'showing';
      captionsTrack.mode = enabled ? 'disabled' : 'showing';
      ccToggleBtn.textContent = enabled ? 'Activar CC' : 'Desactivar CC';
      ccToggleBtn.setAttribute('aria-pressed', String(!enabled));
    });

    adToggleBtn?.addEventListener('click', () => {
      applyAdState(!adEnabled);
    });
  }

  const contactForm = document.querySelector('#contacto form');
  const modal = document.getElementById('formModal');
  const modalConfirm = document.getElementById('modalConfirm');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = modal?.querySelector('.modal-content');
  let modalReturnFocus = null;

  const openModal = ({ message, focusTarget } = {}) => {
    if (!modal) return;
    if (message && modalTitle) {
      modalTitle.textContent = message;
    }
    modalReturnFocus = focusTarget ?? document.activeElement;
    modal.removeAttribute('hidden');
    modal.classList.add('open');
    modalContent?.focus();
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (modalReturnFocus instanceof HTMLElement) {
      modalReturnFocus.focus();
    }
  };

  if (modal) {
    modal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
      }
    });
  }

  modalConfirm?.addEventListener('click', () => {
    closeModal();
  });

  if (contactForm && modal) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const firstField = contactForm.querySelector('input, textarea');
      contactForm.reset();
      openModal({
        message: 'Mensaje enviado exitosamente.',
        focusTarget: firstField instanceof HTMLElement ? firstField : undefined,
      });
    });
  }
});
