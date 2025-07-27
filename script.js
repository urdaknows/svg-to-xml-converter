document.addEventListener('DOMContentLoaded', () => {
    const svgInput = document.getElementById('svg-input');
    const svgContainer = document.getElementById('svg-container');
    const xmlOutput = document.getElementById('xml-output');
    const convertBtn = document.getElementById('convert-btn');
    const errorMessage = document.getElementById('error-message');
    const loader = document.getElementById('loader');
    let svgContent = null;
    let xmlContent = null;
    let svgFileName = null;

    // Manejar la carga del archivo SVG
    svgInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Guardar el nombre del archivo SVG
        svgFileName = file.name.replace(/\.[^/.]+$/, "");

        // Validar tipo MIME y extensión
        if (!file.type.includes('svg') && !file.name.endsWith('.svg')) {
            showError('Only SVG files are allowed.');
            resetUI();
            return;
        }

        try {
            loader.style.display = 'block';

            svgContent = await readFile(file);
            if (!isValidSVG(svgContent)) {
                showError('The file is not a valid SVG.');
                resetUI();
                loader.style.display = 'none';
                return;
            }

            // Mostrar vista previa
            svgContainer.innerHTML = svgContent;
            errorMessage.textContent = '';
            convertBtn.disabled = false;

            // Convertir a XML manualmente
            xmlContent = await convertToVectorDrawable(svgContent);
            xmlOutput.textContent = xmlContent;

            loader.style.display = 'none';
        } catch (err) {
            showError('Error processing the SVG: ' + err.message);
            resetUI();
            loader.style.display = 'none';
        }
    });

    // Convertir y descargar
    convertBtn.addEventListener('click', () => {
        if (xmlContent && svgFileName) {
            downloadXML(xmlContent, `${svgFileName}.xml`);
        }
    });

    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Could not read the file.'));
            reader.readAsText(file);
        });
    }

    function isValidSVG(content) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'image/svg+xml');
            const errorNode = doc.querySelector('parsererror');
            if (errorNode) return false;
            return doc.documentElement.tagName.toLowerCase() === 'svg';
        } catch (err) {
            return false;
        }
    }

    function convertToVectorDrawable(svg) {
        try {
            // Parsear el SVG
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;

            // Obtener dimensiones del viewBox
            const viewBox = svgElement.getAttribute('viewBox');
            if (!viewBox) {
                throw new Error('The SVG must have a viewBox attribute defined.');
            }
            const [minX, minY, width, height] = viewBox.split(/\s+/).map(Number);
            if (!width || !height) {
                throw new Error('The viewBox of the SVG has an invalid format.');
            }

            // Iniciar el XML de VectorDrawable
            let vectorDrawable = `<?xml version="1.0" encoding="utf-8"?>\n`;
            vectorDrawable += `<vector xmlns:android="http://schemas.android.com/apk/res/android"\n`;
            vectorDrawable += `    android:width="${width}dp"\n`;
            vectorDrawable += `    android:height="${height}dp"\n`;
            vectorDrawable += `    android:viewportWidth="${width}"\n`;
            vectorDrawable += `    android:viewportHeight="${height}">\n`;

            // Procesar los elementos del SVG
            const paths = [];
            const elements = svgElement.querySelectorAll('path, rect, circle');
            elements.forEach(element => {
                const pathData = convertElementToPathData(element);
                if (pathData) {
                    const fillColor = element.getAttribute('fill') || '#000000';
                    const strokeColor = element.getAttribute('stroke') || 'none';
                    const strokeWidth = element.getAttribute('stroke-width') || '0';

                    let path = `    <path\n`;
                    path += `        android:pathData="${pathData}"\n`;
                    if (fillColor !== 'none') {
                        path += `        android:fillColor="${normalizeColor(fillColor)}"\n`;
                    }
                    if (strokeColor !== 'none') {
                        path += `        android:strokeColor="${normalizeColor(strokeColor)}"\n`;
                        path += `        android:strokeWidth="${strokeWidth}"\n`;
                    }
                    path += `    />\n`;
                    paths.push(path);
                }
            });

            if (paths.length === 0) {
                throw new Error('No supported elements (path, rect, circle) found in the SVG.');
            }

            // Agregar los paths al VectorDrawable
            vectorDrawable += paths.join('');
            vectorDrawable += `</vector>`;

            return vectorDrawable;
        } catch (err) {
            throw new Error('Conversion failed: ' + err.message);
        }
    }

    // Convertir elementos SVG a datos de path para VectorDrawable
    function convertElementToPathData(element) {
        const tagName = element.tagName.toLowerCase();

        if (tagName === 'path') {
            return element.getAttribute('d') || '';
        } else if (tagName === 'rect') {
            const x = parseFloat(element.getAttribute('x') || '0');
            const y = parseFloat(element.getAttribute('y') || '0');
            const width = parseFloat(element.getAttribute('width') || '0');
            const height = parseFloat(element.getAttribute('height') || '0');
            if (width <= 0 || height <= 0) return null;

            // Convertir rect a un path (M x,y h width v height h -width z)
            return `M${x},${y} h${width} v${height} h${-width} Z`;
        } else if (tagName === 'circle') {
            const cx = parseFloat(element.getAttribute('cx') || '0');
            const cy = parseFloat(element.getAttribute('cy') || '0');
            const r = parseFloat(element.getAttribute('r') || '0');
            if (r <= 0) return null;

            // Convertir círculo a path (aproximación con curvas de Bézier)
            const kappa = 0.5522847498; // Constante para aproximar un círculo con curvas
            const kr = r * kappa;
            return `M${cx - r},${cy} ` +
                   `C${cx - r},${cy - kr} ${cx - kr},${cy - r} ${cx},${cy - r} ` +
                   `C${cx + kr},${cy - r} ${cx + r},${cy - kr} ${cx + r},${cy} ` +
                   `C${cx + r},${cy + kr} ${cx + kr},${cy + r} ${cx},${cy + r} ` +
                   `C${cx - kr},${cy + r} ${cx - r},${cy + kr} ${cx - r},${cy} Z`;
        }

        return null;
    }

    // Normalizar colores al formato hexadecimal #AARRGGBB
    function normalizeColor(color) {
        if (color.startsWith('#')) {
            if (color.length === 4) {
                // Convertir #FFF a #FFFFFFFF
                const r = color[1];
                const g = color[2];
                const b = color[3];
                return `#FF${r}${r}${g}${g}${b}${b}`;
            } else if (color.length === 7) {
                // Añadir opacidad completa (#FFFFFF -> #FFFFFFFF)
                return `#FF${color.slice(1)}`;
            }
        } else if (color.startsWith('rgb')) {
            // Convertir rgb(255, 255, 255) a #FFFFFFFF
            const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                const r = parseInt(match[1]).toString(16).padStart(2, '0');
                const g = parseInt(match[2]).toString(16).padStart(2, '0');
                const b = parseInt(match[3]).toString(16).padStart(2, '0');
                return `#FF${r}${g}${b}`;
            }
        }
        return '#FF000000';
    }

    function downloadXML(content, fileName) {
        const blob = new Blob([content], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    }

    function showError(message) {
        errorMessage.textContent = message;
        convertBtn.disabled = true;
    }

    function resetUI() {
        svgContainer.innerHTML = '';
        xmlOutput.textContent = '';
        convertBtn.disabled = true;
        svgContent = null;
        xmlContent = null;
        svgFileName = null;
    }
});