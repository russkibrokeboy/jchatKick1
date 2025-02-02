// pageSetup.js
class PageSetup {
    constructor(params) {
        this.params = params;
        this.maxMessages = 250;
        this.fontMapper = {
            Small: "size_small",
            Medium: "size_medium",
            Large: "size_large",
        };
        this.strokeMapper = {
            Thin: "stroke_thin",
            Medium: "stroke_medium",
            Thick: "stroke_thick",
            Thicker: "stroke_thicker",
        };
    }

    attachStylesheet(filename) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `assets/${filename}.css`;
        document.head.appendChild(link);
    }

    attachExternalStylesheet(url) {
        fetch(url)
            .then((response) => response.text())
            .then((css) => {
                const style = document.createElement("style");
                style.innerHTML = css;
                document.head.appendChild(style);
            });
    }

    applyCustomisation() {
        this.attachStylesheet(this.fontMapper[this.params.get("font-size")]);
        this.attachStylesheet(this.strokeMapper[this.params.get("stroke")]);
        if (this.params.get("external-css")) {
            this.attachExternalStylesheet(this.params.get("external-css"));
        }
    }
}

// Make PageSetup available globally
window.PageSetup = PageSetup;