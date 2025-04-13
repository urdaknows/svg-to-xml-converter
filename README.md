# SVG to XML Converter for Android 📱✨

![Project Status](https://img.shields.io/badge/status-active-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

A lightweight, mobile-friendly web tool to convert SVG files into Android VectorDrawable XML format. No external libraries required! Built with pure JavaScript, HTML, and CSS, this project is perfect for Android developers who need to convert vector graphics on the go.

## 🚀 Features

- **SVG to VectorDrawable Conversion**: Converts SVG files to Android-compatible XML (VectorDrawable) without external dependencies.
- **Mobile-Optimized**: Fully responsive design, optimized for touch interactions on mobile devices.
- **File Name Preservation**: The downloaded XML file inherits the name of the uploaded SVG (e.g., `icon.svg` → `icon.xml`).
- **Preview Support**: See a live preview of the SVG and the generated XML before downloading.
- **Lightweight & Offline**: Works entirely in the browser, no server or external libraries needed.
- **Error Handling**: Clear error messages for invalid SVGs or unsupported elements.

## 📖 How It Works

This tool parses SVG files using the browser's `DOMParser`, extracts supported elements (`<path>`, `<rect>`, `<circle>`), and converts them into an Android VectorDrawable XML format. It supports basic attributes like `fill`, `stroke`, and `stroke-width`, ensuring the generated XML is ready to use in Android projects.

## 🖼️ Demo

*Insert a screenshot or GIF of the tool in action here. For example, show the interface with an SVG preview and the generated XML on a mobile device.*

## 🛠️ Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, etc.).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/iKiwo/svg-to-xml-converter.git
