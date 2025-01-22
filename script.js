class FacebookCopyGenerator {
    constructor() {
        this.init();
        this.bindEvents();
    }

    init() {
        // Initialize theme
        this.theme = localStorage.getItem('theme') || 'light';
        document.body.className = `${this.theme}-theme`;
        document.getElementById('themeToggle').checked = this.theme === 'dark';

        // Load API key if exists
        this.apiKey = localStorage.getItem('openRouterApiKey');
        if (this.apiKey) {
            document.getElementById('apiKey').value = this.apiKey;
        }

        // Load saved model preference if exists
        this.selectedModel = localStorage.getItem('selectedModel') || 'google/learnlm-1.5-pro-experimental:free';
        document.getElementById('modelSelect').value = this.selectedModel;
    }

    bindEvents() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('change', (e) => {
            this.toggleTheme(e.target.checked);
        });

        // API key save
        document.getElementById('saveApiKey').addEventListener('click', () => {
            this.saveApiKey();
        });

        // Generate button
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateContent();
        });

        // Copy button
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyContent();
        });

        // Download button
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadContent();
        });

        // Add model selection event
        document.getElementById('modelSelect').addEventListener('change', (e) => {
            this.selectedModel = e.target.value;
            localStorage.setItem('selectedModel', this.selectedModel);
        });
    }

    toggleTheme(isDark) {
        this.theme = isDark ? 'dark' : 'light';
        document.body.className = `${this.theme}-theme`;
        localStorage.setItem('theme', this.theme);
    }

    saveApiKey() {
        const apiKey = document.getElementById('apiKey').value.trim();
        if (apiKey) {
            localStorage.setItem('openRouterApiKey', apiKey);
            this.apiKey = apiKey;
            alert('Kunci API berjaya disimpan!');
        } else {
            alert('Sila masukkan kunci API yang sah.');
        }
    }

    async generatePainPoints(productDetails) {
        const prompt = `Berdasarkan produk/perkhidmatan berikut: "${productDetails}", 
            sila janakan 3 titik kesakitan utama dalam Bahasa Malaysia.`;

        try {
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Facebook Ad Copy Generator',
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: this.selectedModel,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API request failed');
            }

            const data = await response.json();
            if (!data.choices?.[0]?.message?.content) {
                throw new Error('Unexpected API response format');
            }

            return this.parsePainPoints(data.choices[0].message.content);
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Permintaan mengambil masa terlalu lama. Sila cuba lagi.');
            }
            console.error('Error generating pain points:', error);
            alert(`Ralat: ${error.message || 'Sila periksa kunci API anda dan cuba lagi.'}`);
            throw error;
        }
    }

    parsePainPoints(content) {
        // Simple parsing assuming the AI returns numbered or bullet-pointed list
        return content.split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^\d+\.|•|-/, '').trim());
    }

    async generateCopy(productDetails, framework, painPoint) {
        const prompt = `Sila jana salinan iklan Facebook dalam Bahasa Malaysia menggunakan rangka kerja ${framework} 
            untuk produk/perkhidmatan berikut: "${productDetails}"
            Fokus pada titik kesakitan ini: "${painPoint}"
            
            Penting:
            1. Gunakan emoji yang berkaitan (2-3 emoji sahaja)
            2. Tulis dalam bentuk perbualan yang santai dan mesra
            3. Pastikan format penulisan seperti di Facebook (ada baris kosong antara perenggan)
            4. Jangan terlalu formal
            5. Tambah call-to-action yang menarik di akhir
            6. Maksimum 500 patah perkataan`;

        try {
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Facebook Ad Copy Generator',
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: this.selectedModel,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API request failed');
            }

            const data = await response.json();
            if (!data.choices?.[0]?.message?.content) {
                throw new Error('Unexpected API response format');
            }

            // Format the content with proper spacing
            let content = data.choices[0].message.content;
            content = content.replace(/\n/g, '\n\n'); // Double spacing between paragraphs
            content = content.replace(/\n\n\n+/g, '\n\n'); // Remove excessive spacing

            return content;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Permintaan mengambil masa terlalu lama. Sila cuba lagi.');
            }
            console.error('Error generating copy:', error);
            alert(`Ralat: ${error.message || 'Sila periksa kunci API anda dan cuba lagi.'}`);
            throw error;
        }
    }

    async generateContent() {
        if (!this.apiKey) {
            alert('Sila masukkan kunci API terlebih dahulu.');
            return;
        }

        const productDetails = document.getElementById('productDetails').value;
        if (!productDetails) {
            alert('Sila masukkan butiran produk/perkhidmatan.');
            return;
        }

        const progressBar = document.querySelector('.progress-bar');
        progressBar.style.display = 'block';
        const progress = document.querySelector('.progress');
        progress.style.width = '0%';

        try {
            // Generate pain points
            progress.style.width = '30%';
            const painPoints = await this.generatePainPoints(productDetails);
            
            if (!painPoints || painPoints.length === 0) {
                throw new Error('Tiada titik kesakitan yang dijana');
            }

            // Display pain points for selection
            const painPointsSection = document.querySelector('.pain-points');
            painPointsSection.style.display = 'block';
            this.displayPainPoints(painPoints);

            progress.style.width = '60%';

            // Wait for pain point selection
            const selectedPainPoint = await this.waitForPainPointSelection();
            
            // Generate copy with selected framework and pain point
            const framework = document.getElementById('frameworkSelect').value;
            const copy = await this.generateCopy(productDetails, framework, selectedPainPoint);

            if (!copy) {
                throw new Error('Tiada salinan yang dijana');
            }

            // Display the generated copy
            this.displayGeneratedCopy(copy);
            
            progress.style.width = '100%';
            setTimeout(() => {
                progressBar.style.display = 'none';
                progress.style.width = '0%';
            }, 1000);

        } catch (error) {
            console.error('Error:', error);
            alert(`Ralat semasa menjana kandungan: ${error.message}`);
            progressBar.style.display = 'none';
        }
    }

    displayPainPoints(painPoints) {
        const painPointsList = document.getElementById('painPointsList');
        painPointsList.innerHTML = painPoints.map(point => 
            `<div class="pain-point-item">${point}</div>`
        ).join('');

        // Add click handlers
        const items = painPointsList.getElementsByClassName('pain-point-item');
        Array.from(items).forEach(item => {
            item.addEventListener('click', () => {
                Array.from(items).forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            });
        });
    }

    waitForPainPointSelection() {
        return new Promise((resolve) => {
            const painPointsList = document.getElementById('painPointsList');
            const checkSelection = setInterval(() => {
                const selected = painPointsList.querySelector('.selected');
                if (selected) {
                    clearInterval(checkSelection);
                    resolve(selected.textContent);
                }
            }, 100);
        });
    }

    displayGeneratedCopy(copy) {
        const previewSection = document.querySelector('.preview-section');
        const postContent = document.querySelector('.post-content');
        
        previewSection.style.display = 'block';
        postContent.textContent = copy;
    }

    copyContent() {
        const content = document.querySelector('.post-content').textContent;
        navigator.clipboard.writeText(content)
            .then(() => alert('Kandungan berjaya disalin!'))
            .catch(() => alert('Ralat semasa menyalin kandungan.'));
    }

    downloadContent() {
        const content = document.querySelector('.post-content').textContent;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'facebook-ad-copy.txt';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new FacebookCopyGenerator();
}); 