function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Formato de imagen no compatible.'));
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

function cropSquare(img, size = 512, quality = .84) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { alpha: false });
  const source = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const sx = ((img.naturalWidth || img.width) - source) / 2;
  const sy = ((img.naturalHeight || img.height) - source) / 2;
  ctx.fillStyle = '#121416';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, sx, sy, source, source, 0, 0, size, size);
  let value = canvas.toDataURL('image/webp', quality);
  if (!value.startsWith('data:image/webp')) value = canvas.toDataURL('image/jpeg', quality);
  return value;
}

async function normalizeUpload(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Selecciona un archivo de imagen.');
  if (file.size > 10 * 1024 * 1024) throw new Error('La imagen supera 10 MB.');
  const img = await fileToImage(file);
  let data = cropSquare(img, 512, .84);
  if (data.length > 780000) data = cropSquare(img, 384, .78);
  if (data.length > 880000) throw new Error('La imagen sigue siendo demasiado grande después de optimizarla.');
  return data;
}

export function installProfilePhotoUpload(manager) {
  if (!manager || manager.__profilePhotoUploadInstalled) return manager;
  manager.__profilePhotoUploadInstalled = true;

  const originalRenderProfilePanel = manager.renderProfilePanel.bind(manager);
  const originalFillProfileControls = manager.fillProfileControls.bind(manager);

  manager.renderProfilePanel = function renderProfilePanelWithUpload() {
    originalRenderProfilePanel();
    const photoInput = this.controls.get('photoUrl');
    const identity = photoInput?.closest('.zam-group');
    if (!photoInput || !identity || identity.querySelector('[data-zam-photo-upload]')) return;

    const originalField = photoInput.closest('.zam-field');
    originalField.classList.add('zam-photo-url-field');
    originalField.hidden = true;

    const wrap = document.createElement('div');
    wrap.className = 'zam-photo-upload';
    wrap.dataset.zamPhotoUpload = 'true';
    wrap.innerHTML = `
      <div class="zam-photo-preview" aria-label="Vista previa de foto"><span aria-hidden="true">Foto</span></div>
      <div class="zam-photo-copy">
        <strong>Foto de perfil</strong>
        <small>Se recorta al centro y se optimiza automáticamente. La vista pública usa marco circular.</small>
        <div class="zam-photo-actions">
          <button type="button" data-zam-photo-action="choose">Subir foto</button>
          <button type="button" data-zam-photo-action="remove">Eliminar</button>
        </div>
        <details class="zam-photo-advanced"><summary>Usar URL en su lugar</summary></details>
      </div>`;
    wrap.querySelector('.zam-photo-advanced').appendChild(originalField);

    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/png,image/jpeg,image/webp';
    file.hidden = true;
    file.dataset.zamPhotoFile = 'true';
    wrap.appendChild(file);

    identity.insertBefore(wrap, identity.children[1] || null);
    this.photoUpload = { wrap, file, photoInput };

    wrap.addEventListener('click', (event) => {
      const action = event.target instanceof Element ? event.target.closest('[data-zam-photo-action]')?.dataset.zamPhotoAction : null;
      if (action === 'choose') file.click();
      if (action === 'remove') {
        photoInput.value = '';
        this.updatePhotoPreview?.();
      }
    });

    file.addEventListener('change', async () => {
      const selected = file.files?.[0];
      file.value = '';
      if (!selected) return;
      try {
        this.status?.('Procesando foto…', 'info');
        photoInput.value = await normalizeUpload(selected);
        this.updatePhotoPreview?.();
        this.status?.('Foto lista. Pulsa Guardar Acerca de para conservarla.', 'ok');
      } catch (error) {
        this.status?.(error.message, 'error');
      }
    });

    photoInput.addEventListener('input', () => this.updatePhotoPreview?.());
    this.updatePhotoPreview?.();
  };

  manager.updatePhotoPreview = function updatePhotoPreview() {
    const target = this.photoUpload?.wrap?.querySelector('.zam-photo-preview');
    const value = this.controls.get('photoUrl')?.value?.trim() || '';
    if (!target) return;
    target.replaceChildren();
    if (!value) {
      const placeholder = document.createElement('span');
      placeholder.textContent = 'Foto';
      placeholder.setAttribute('aria-hidden', 'true');
      target.appendChild(placeholder);
      return;
    }
    const img = document.createElement('img');
    img.src = value;
    img.alt = 'Vista previa de foto de perfil';
    target.appendChild(img);
  };

  manager.fillProfileControls = function fillProfileControlsWithPhoto() {
    originalFillProfileControls();
    this.updatePhotoPreview?.();
  };

  return manager;
}
