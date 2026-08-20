function field(labelText, control) {
  const label = document.createElement('label');
  label.className = 'zam-field';
  const span = document.createElement('span');
  span.textContent = labelText;
  label.append(span, control);
  return label;
}

function input(type, placeholder) {
  const control = document.createElement('input');
  control.type = type;
  control.placeholder = placeholder;
  return control;
}

function textarea(placeholder) {
  const control = document.createElement('textarea');
  control.rows = 3;
  control.placeholder = placeholder;
  return control;
}

export function installBloggerProfileFields(manager) {
  const originalRenderProfilePanel = manager.renderProfilePanel.bind(manager);
  const originalFillProfileControls = manager.fillProfileControls.bind(manager);
  const originalReadProfileControls = manager.readProfileControls.bind(manager);

  manager.renderProfilePanel = function renderProfilePanelWithClassicFields() {
    originalRenderProfilePanel();
    const panel = this.profilePanel();
    if (!panel || panel.querySelector('[data-blogger-classic-fields]')) return;

    const details = document.createElement('details');
    details.className = 'zam-details';
    details.dataset.bloggerClassicFields = 'true';
    details.innerHTML = '<summary><span>Campos clásicos de Blogger</span><small>Opcionales / heredados</small></summary>';

    const body = document.createElement('div');
    body.className = 'zam-details-body';

    const audioClipUrl = this.registerControl('audioClipUrl', input('url', 'https://…'));
    const wishlistUrl = this.registerControl('wishlistUrl', input('url', 'https://…'));
    const randomQuestion = this.registerControl('randomQuestion', input('text', 'Pregunta aleatoria'));
    const randomAnswer = this.registerControl('randomAnswer', textarea('Respuesta'));

    body.append(
      field('Audio Clip', audioClipUrl),
      field('Wishlist', wishlistUrl),
      field('Random Question', randomQuestion),
      field('Respuesta', randomAnswer)
    );
    details.appendChild(body);
    panel.appendChild(details);
  };

  manager.fillProfileControls = function fillProfileControlsWithClassicFields() {
    originalFillProfileControls();
    const profile = this.data?.profile ?? {};
    for (const key of ['audioClipUrl', 'wishlistUrl', 'randomQuestion', 'randomAnswer']) {
      const control = this.controls.get(key);
      if (control) control.value = profile[key] ?? '';
    }
  };

  manager.readProfileControls = function readProfileControlsWithClassicFields() {
    const profile = originalReadProfileControls();
    const get = (key) => this.controls.get(key)?.value?.trim() ?? '';
    return {
      ...profile,
      audioClipUrl: get('audioClipUrl'),
      wishlistUrl: get('wishlistUrl'),
      randomQuestion: get('randomQuestion'),
      randomAnswer: get('randomAnswer')
    };
  };

  return manager;
}
