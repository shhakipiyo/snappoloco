let currentFrameType = '';
let selectedFrameName = '';
let selectedColor = '';
let photoSlots = [];
let currentEditingSlot = -1;

// Frame specifications (in pixels, converted from cm at 96 DPI)
const frameSpecs = {
    polaroid: {
        width: 340, // 9cm
        height: 416, // 11cm
        photoWidth: 300, // 7.9cm - lebih lebar
        photoHeight: 300, // 7.9cm - lebih tinggi
        photoX: 20, // margin kiri/kanan lebih kecil
        photoY: 20, // margin atas lebih kecil
        borderColor: true
    },
    strip2: {
        width: 189, // 5cm
        height: 567, // 15cm
        borderLeft: 15, // 0.4cm
        borderRight: 15, // 0.4cm
        borderTop: 23, // 0.6cm
        borderBottom: 83, // 2.2cm
        photoSpacing: 11, // 0.3cm
        photoWidth: 159, // 4.2cm
        photoHeight: 227, // 6cm
        borderColor: true
    },
    strip3: {
        width: 189, // 5cm
        height: 567, // 15cm
        borderLeft: 15, // 0.4cm
        borderRight: 15, // 0.4cm
        borderTop: 23, // 0.6cm
        borderBottom: 83, // 2.2cm
        photoSpacing: 11, // 0.3cm
        photoWidth: 159, // 4.2cm
        photoHeight: 147, // 3.9cm
        borderColor: true
    },
    strip4: {
        width: 189, // 5cm
        height: 567, // 15cm
        borderLeft: 15, // 0.4cm
        borderRight: 15, // 0.4cm
        borderTop: 23, // 0.6cm
        borderBottom: 83, // 2.2cm
        photoSpacing: 11, // 0.3cm
        photoWidth: 159, // 4.2cm
        photoHeight: 107, // 2.8cm
        borderColor: true
    }
};

// Frame data dengan 7 warna untuk semua frame
const frameData = {
    polaroid: {
        free: [
            { name: '', colors: ['white', 'black', 'grey', 'pink', 'purple', 'yellow', 'green'] }
        ]
    },
    strip2: {
        free: [
            { name: '', colors: ['white', 'black', 'grey', 'pink', 'purple', 'yellow', 'green'] }
        ]
    },
    strip3: {
        free: [
            { name: '', colors: ['white', 'black', 'grey', 'pink', 'purple', 'yellow', 'green'] }
        ]
    },
    strip4: {
        free: [
            { name: '', colors: ['white', 'black', 'grey', 'pink', 'purple', 'yellow', 'green'] }
        ]
    }
};

// Frame category selection
document.querySelectorAll('.frame-category').forEach(category => {
    category.addEventListener('click', function() {
        currentFrameType = this.dataset.frame;
        if (currentFrameType !== 'premium') {
            showFrameOptions(currentFrameType);
        }
    });
});

function showFrameOptions(frameType) {
    document.getElementById('categorySection').style.display = 'none';
    document.getElementById('frameOptions').classList.add('active');
    document.getElementById('premiumSection').classList.remove('active');
    
    populateFrames(frameType);
}

function showPremiumFrames() {
    document.getElementById('categorySection').style.display = 'none';
    document.getElementById('frameOptions').classList.remove('active');
    document.getElementById('premiumSection').classList.add('active');
}

function populateFrames(frameType) {
    const freeContainer = document.getElementById('freeFrames');
    
    // Populate free frames
    freeContainer.innerHTML = frameData[frameType].free.map(frame => `
        <div class="frame-item free">
            <div class="frame-display">
                <div style="color: #10b981; font-size: 2rem;">🖼️</div>
            </div>
            ${frame.name ? `<div class="frame-name">${frame.name}</div>` : ''}
            <button class="btn btn-upload" onclick="showColorOptions('${frame.name}', ${JSON.stringify(frame.colors).replace(/"/g, '&quot;')})">
                Upload Foto
            </button>
        </div>
    `).join('');
}

function backToCategories() {
    document.getElementById('categorySection').style.display = 'block';
    document.getElementById('frameOptions').classList.remove('active');
    document.getElementById('premiumSection').classList.remove('active');
}

function showColorOptions(frameName, colors) {
    selectedFrameName = frameName;
    const colorContainer = document.getElementById('colorOptions');
    
    colorContainer.innerHTML = colors.map(color => `
        <div style="text-align: center; cursor: pointer; padding: 15px; border: 2px solid #e5e7eb; border-radius: 12px; transition: all 0.3s ease;" 
             onclick="selectColor('${color}')" 
             onmouseover="this.style.borderColor='#10b981'; this.style.transform='translateY(-2px)'" 
             onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'">
            <div style="width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 10px; background: ${getColorCode(color)}; border: 2px solid #ddd;"></div>
            <div style="font-size: 0.9rem; font-weight: 500; color: #4a5568; text-transform: capitalize;">${color}</div>
        </div>
    `).join('');
    
    document.getElementById('colorModal').classList.add('active');
}

function getColorCode(colorName) {
    const colors = {
        'white': '#ffffff',
        'black': '#000000',
        'grey': '#5f646eff',
        'pink': '#ffc0cb',
        'purple': '#e8c5f0',
        'yellow': '#fff4cc',
        'green': '#d4edda'
    };
    return colors[colorName] || '#f3f4f6';
}

function selectColor(color) {
    selectedColor = color;
    closeColorModal();
    initializePhotoEditor();
}

function closeColorModal() {
    document.getElementById('colorModal').classList.remove('active');
}

function initializePhotoEditor() {
    // Hide frame options and show photo editor
    document.getElementById('frameOptions').classList.remove('active');
    document.getElementById('photoEditor').classList.add('active');
    
    // Set editor title
    document.getElementById('editorTitle').textContent = `Frame ${currentFrameType} - ${selectedColor}`;
    
    // Initialize photo slots based on frame type
    const numPhotos = currentFrameType === 'polaroid' ? 1 : 
                     currentFrameType === 'strip2' ? 2 :
                     currentFrameType === 'strip3' ? 3 : 4;
    
    photoSlots = Array(numPhotos).fill(null).map(() => ({
        image: null,
        scale: 1,
        offsetX: 0,
        offsetY: 0
    }));
    
    createPhotoSlots();
    setupFrameCanvas();
    updateFramePreview();
    checkAllPhotosLoaded();
}

function createPhotoSlots() {
    const container = document.getElementById('photoSlots');
    container.className = `photo-slots ${currentFrameType === 'polaroid' ? 'polaroid' : 'strip'}`;
    
    container.innerHTML = photoSlots.map((slot, index) => `
        <div class="photo-slot" onclick="selectPhoto(${index})">
            <div style="font-size: 2rem; margin-bottom: 10px;">📷</div>
            <div style="color: #6b7280; font-weight: 500;">Add Image ${index + 1}</div>
            <div class="photo-controls">
                <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${index}, 'scale', 0.1)">Zoom +</button>
                <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${index}, 'scale', -0.1)">Zoom -</button>
                <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${index}, 'offsetX', -10)">← Move</button>
                <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${index}, 'offsetX', 10)">Move →</button>
                <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${index}, 'offsetY', -10)">↑ Move</button>
                <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${index}, 'offsetY', 10)">Move ↓</button>
                <button class="control-btn" onclick="event.stopPropagation(); removePhoto(${index})" style="color: #ef4444;">Remove</button>
            </div>
        </div>
    `).join('');
}

function setupFrameCanvas() {
    const canvas = document.getElementById('frameCanvas');
    const spec = frameSpecs[currentFrameType];
    canvas.width = spec.width;
    canvas.height = spec.height;
    canvas.style.maxWidth = '300px';
}

function selectPhoto(slotIndex) {
    currentEditingSlot = slotIndex;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showNotification('Ukuran file terlalu besar! Maksimal 5MB', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    photoSlots[slotIndex] = {
                        image: img,
                        scale: 1,
                        offsetX: 0,
                        offsetY: 0
                    };
                    updatePhotoSlot(slotIndex);
                    updateFramePreview();
                    checkAllPhotosLoaded();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function updatePhotoSlot(slotIndex) {
    const slots = document.querySelectorAll('.photo-slot');
    const slot = slots[slotIndex];
    const photoData = photoSlots[slotIndex];
    
    if (photoData.image) {
        slot.classList.add('has-image');
        slot.innerHTML = `
            <img src="${photoData.image.src}" alt="Photo ${slotIndex + 1}">
            <div style="color: #10b981; font-weight: 500;">Photo ${slotIndex + 1} Ready</div>
            <div class="photo-controls">
                <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${slotIndex}, 'scale', 0.1)">Zoom +</button>
                <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${slotIndex}, 'scale', -0.1)">Zoom -</button>
                <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${slotIndex}, 'offsetX', -10)">← Move</button>
                <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${slotIndex}, 'offsetX', 10)">Move →</button>
                <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${slotIndex}, 'offsetY', -10)">↑ Move</button>
                <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${slotIndex}, 'offsetY', 10)">Move ↓</button>
                <button class="control-btn" onclick="event.stopPropagation(); removePhoto(${slotIndex})" style="color: #ef4444;">Remove</button>
            </div>
        `;
    }
}

function adjustPhoto(slotIndex, property, delta) {
    const photoData = photoSlots[slotIndex];
    if (!photoData.image) return;
    
    if (property === 'scale') {
        photoData.scale = Math.max(0.1, Math.min(3, photoData.scale + delta));
    } else {
        photoData[property] += delta;
    }
    
    updateFramePreview();
}

function removePhoto(slotIndex) {
    photoSlots[slotIndex] = {
        image: null,
        scale: 1,
        offsetX: 0,
        offsetY: 0
    };
    
    const slots = document.querySelectorAll('.photo-slot');
    const slot = slots[slotIndex];
    slot.classList.remove('has-image');
    slot.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 10px;">📷</div>
        <div style="color: #6b7280; font-weight: 500;">Add Image ${slotIndex + 1}</div>
        <div class="photo-controls">
            <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${slotIndex}, 'scale', 0.1)">Zoom +</button>
            <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${slotIndex}, 'scale', -0.1)">Zoom -</button>
            <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${slotIndex}, 'offsetX', -10)">← Move</button>
            <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${slotIndex}, 'offsetX', 10)">Move →</button>
            <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${slotIndex}, 'offsetY', -10)">↑ Move</button>
            <button class="control-btn" onclick="event.stopPropagation(); adjustPhoto(${slotIndex}, 'offsetY', 10)">Move ↓</button>
            <button class="control-btn" onclick="event.stopPropagation(); removePhoto(${slotIndex})" style="color: #ef4444;">Remove</button>
        </div>
    `;
    
    updateFramePreview();
    checkAllPhotosLoaded();
}

function updateFramePreview() {
    const canvas = document.getElementById('frameCanvas');
    const ctx = canvas.getContext('2d');
    const spec = frameSpecs[currentFrameType];
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background color menggunakan getColorCode
    ctx.fillStyle = getColorCode(selectedColor);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw photos based on frame type
    if (currentFrameType === 'polaroid') {
        drawPolaroidPhoto(ctx, spec, 0);
    } else {
        drawStripPhotos(ctx, spec);
    }
}

function drawPolaroidPhoto(ctx, spec, slotIndex) {
    const photoData = photoSlots[slotIndex];
    if (!photoData.image) return;
    
    const img = photoData.image;
    const scale = photoData.scale;
    const offsetX = photoData.offsetX;
    const offsetY = photoData.offsetY;
    
    // Calculate aspect ratio and fit image properly - maintain original proportions
    const imgAspect = img.width / img.height;
    const frameAspect = spec.photoWidth / spec.photoHeight;
    
    let drawWidth, drawHeight;
    
    // Always maintain original aspect ratio
    if (imgAspect > frameAspect) {
        // Image is wider - fit to height and let width overflow
        drawHeight = spec.photoHeight * scale;
        drawWidth = drawHeight * imgAspect;
    } else {
        // Image is taller - fit to width and let height overflow
        drawWidth = spec.photoWidth * scale;
        drawHeight = drawWidth / imgAspect;
    }
    
    // Calculate position with offset - center the image
    const x = spec.photoX + offsetX + (spec.photoWidth - drawWidth) / 2;
    const y = spec.photoY + offsetY + (spec.photoHeight - drawHeight) / 2;
    
    // Clip to photo area
    ctx.save();
    ctx.beginPath();
    ctx.rect(spec.photoX, spec.photoY, spec.photoWidth, spec.photoHeight);
    ctx.clip();
    
    // Draw image maintaining aspect ratio
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    ctx.restore();
}

function drawStripPhotos(ctx, spec) {
    photoSlots.forEach((photoData, index) => {
        if (!photoData.image) return;
        
        const img = photoData.image;
        const scale = photoData.scale;
        const offsetX = photoData.offsetX;
        const offsetY = photoData.offsetY;
        
        // Calculate photo position
        const photoY = spec.borderTop + index * (spec.photoHeight + spec.photoSpacing);
        
        // Calculate aspect ratio and fit image properly - maintain original proportions
        const imgAspect = img.width / img.height;
        const frameAspect = spec.photoWidth / spec.photoHeight;
        
        let drawWidth, drawHeight;
        
        // Always maintain original aspect ratio
        if (imgAspect > frameAspect) {
            // Image is wider - fit to height and let width overflow
            drawHeight = spec.photoHeight * scale;
            drawWidth = drawHeight * imgAspect;
        } else {
            // Image is taller - fit to width and let height overflow
            drawWidth = spec.photoWidth * scale;
            drawHeight = drawWidth / imgAspect;
        }
        
        // Calculate position with offset - center the image
        const x = spec.borderLeft + offsetX + (spec.photoWidth - drawWidth) / 2;
        const y = photoY + offsetY + (spec.photoHeight - drawHeight) / 2;
        
        // Clip to photo area
        ctx.save();
        ctx.beginPath();
        ctx.rect(spec.borderLeft, photoY, spec.photoWidth, spec.photoHeight);
        ctx.clip();
        
        // Draw image maintaining aspect ratio
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        ctx.restore();
    });
}

function checkAllPhotosLoaded() {
    const allLoaded = photoSlots.every(slot => slot.image !== null);
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = !allLoaded;
    
    if (allLoaded) {
        generateBtn.textContent = 'Generate Frame';
        generateBtn.style.background = '#10b981';
    } else {
        const loadedCount = photoSlots.filter(slot => slot.image !== null).length;
        generateBtn.textContent = `Upload ${photoSlots.length - loadedCount} foto lagi`;
        generateBtn.style.background = '#9ca3af';
    }
}

function generateFinalFrame() {
    const canvas = document.getElementById('frameCanvas');
    showPhotoResult(canvas);
}

function showPhotoResult(canvas) {
    // Create result modal
    const resultModal = document.createElement('div');
    resultModal.className = 'upload-modal active';
    resultModal.innerHTML = `
        <div class="upload-content" style="max-width: 400px;">
            <h3 style="margin-bottom: 20px; color: #4a5568;">Frame Siap!</h3>
            <div style="margin: 20px 0; text-align: center;">
                <canvas id="resultCanvas" style="max-width: 100%; border: 1px solid #ddd; border-radius: 8px;"></canvas>
            </div>
            <div style="display: flex; gap: 15px; margin-top: 20px;">
                <button class="btn btn-upload" onclick="downloadFrame()">Download Frame</button>
                <button class="btn" style="background: #6b7280; color: white;" onclick="closeResultModal()">Tutup</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(resultModal);
    
    // Copy canvas to result modal
    const resultCanvas = resultModal.querySelector('#resultCanvas');
    resultCanvas.width = canvas.width;
    resultCanvas.height = canvas.height;
    const resultCtx = resultCanvas.getContext('2d');
    resultCtx.drawImage(canvas, 0, 0);
    
    // Store canvas for download
    window.currentFrameCanvas = canvas;
}

function downloadFrame() {
    if (window.currentFrameCanvas) {
        const link = document.createElement('a');
        link.download = `snappoloco-${currentFrameType}-${selectedColor}-${Date.now()}.png`;
        link.href = window.currentFrameCanvas.toDataURL();
        link.click();
        showNotification('Frame berhasil didownload!', 'success');
    }
}

function closeResultModal() {
    const resultModal = document.querySelector('.upload-modal.active');
    if (resultModal && resultModal.querySelector('#resultCanvas')) {
        resultModal.remove();
    }
}

function backToFrameOptions() {
    document.getElementById('photoEditor').classList.remove('active');
    document.getElementById('frameOptions').classList.add('active');
}

function orderToWhatsApp() {
    const message =
`Halo! Saya ingin memesan Frame Premium.

📝 DETAIL PESANAN:
Nama:
Pilihan Frame: Frame 1 / Frame 2 / Frame 3
Jenis Cetak: Soft File / Hard File

💰 PRICELIST:
- Soft File: Rp 3.000
- Hard File: Rp 8.000

Mohon informasi lebih lanjut. Terima kasih!`;

    const whatsappUrl = "https://wa.me/6282152917180?text=" + encodeURIComponent(message);
    window.open(whatsappUrl, "_blank");
}


function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 1001;
        font-weight: 500;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Drag and drop functionality
const uploadArea = document.querySelector('.upload-area');
const fileInput = document.getElementById('fileInput');

if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
        }
    });
}
