/*
NightPDF Dark mode for Pdfs    
Copyright (C) 2021  Advaith Madhukar

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; version 2
of the License.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/
/*eslint-env browser*/
import * as noUiSlider from "nouislider";
function _try(func: Function, fallbackValue: number) {
	try {
		const value = func();
		return value === null || value === undefined ? fallbackValue : value;
	} catch (e) {
		return fallbackValue;
	}
}

declare global {
	interface Window {
		api: {
			getPath(arg0: string): Promise<string>;
			removeAllListeners(arg0: string): null;
			openNewPDF(arg0: null | string): null;
			newWindow(arg0: string): null;
			togglePrinting(arg0: Boolean): null;
			resizeWindow(arg0: null | string): null;
			on(arg0: string, arg1: Function): null;
		};
	}
	interface HTMLElement {
		noUiSlider: any;
	}
	interface File {
		path: string;
	}
}

const nightPDF = (function () {
	console.log("loading");
	let _pdfElement: HTMLIFrameElement;
	let _appContainerElement: HTMLElement;
	let _headerElement: HTMLElement;
	let _titleElement: HTMLElement;
	let _darkConfiguratorElement: HTMLElement;
	let _brightnessSliderElement: HTMLElement;
	let _grayscaleSliderElement: HTMLElement;
	let _invertSliderElement: HTMLElement;
	let _sepiaSliderElement: HTMLElement;
	let _hueSliderElement: HTMLElement;
	let _extraBrightnessSliderElement: HTMLElement;
	let _splashElement: HTMLElement;
	let _splashExtraElement: HTMLElement;
	let _defaultButton: HTMLElement;
	let _sepiaButton: HTMLElement;
	let _redeyeButton: HTMLElement;
	let _customButton: HTMLElement;

	function main() {
		_appContainerElement = document.getElementById(
			"appContainer",
		) as HTMLElement;
		_pdfElement = document.getElementById("pdfjs") as HTMLIFrameElement;
		_headerElement = document.getElementById("header") as HTMLElement;
		_titleElement = document.getElementById("title") as HTMLElement;
		_defaultButton = document.getElementById("default-button") as HTMLElement;
		_sepiaButton = document.getElementById("sepia-button") as HTMLElement;
		_redeyeButton = document.getElementById("redeye-button") as HTMLElement;
		_customButton = document.getElementById("custom-button") as HTMLElement;
		_darkConfiguratorElement = document.getElementById(
			"darkConfigurator",
		) as HTMLElement;
		_brightnessSliderElement = document.getElementById(
			"brightnessSlider",
		) as HTMLElement;
		_grayscaleSliderElement = document.getElementById(
			"grayscaleSlider",
		) as HTMLElement;
		_invertSliderElement = document.getElementById(
			"invertSlider",
		) as HTMLElement;
		_sepiaSliderElement = document.getElementById("sepiaSlider") as HTMLElement;
		_hueSliderElement = document.getElementById("hueSlider") as HTMLElement;
		_extraBrightnessSliderElement = document.getElementById(
			"extraBrightnessSlider",
		) as HTMLElement;
		_splashElement = document.getElementById("splash") as HTMLElement;
		_splashExtraElement = document.getElementById(
			"splash-extra",
		) as HTMLElement;

		//setup electron listeners
		window.api.removeAllListeners("file-open");
		window.api.on("file-open", (_e: Event, msg: string) => {
			_openFile(msg);
		});

		window.api.removeAllListeners("file-print");
		window.api.on("file-print", (_e: Event, _msg: string) => {
			const print = _pdfElement.ownerDocument.getElementById("print");
			if (print) {
				print.dispatchEvent(new Event("click"));
			}
		});

		// setup dom listeners
		_defaultButton.addEventListener("click", (e: Event) => {
			// do default styling

			if (_defaultButton.className.includes("active")) {
				_toggleDarkConfigurator();
			} else {
				_defaultButton.className = "button active";
				_sepiaButton.className = "button";
				_redeyeButton.className = "button";
				_customButton.className = "button";
				_handlePresetChange("default");
			}

			e.stopPropagation();
		});
		_sepiaButton.addEventListener("click", (e: Event) => {
			// do default styling
			if (_sepiaButton.className.includes("active")) {
				_toggleDarkConfigurator();
			} else {
				_defaultButton.className = "button";
				_sepiaButton.className = "button active";
				_redeyeButton.className = "button";
				_customButton.className = "button";
				_handlePresetChange("sepia");
			}
			e.stopPropagation();
		});
		_redeyeButton.addEventListener("click", (e: Event) => {
			// do default styling
			// only display menu if active
			if (_redeyeButton.className.includes("active")) {
				_toggleDarkConfigurator();
			} else {
				_defaultButton.className = "button";
				_sepiaButton.className = "button";
				_redeyeButton.className = "button active";
				_customButton.className = "button";
				_handlePresetChange("redeye");
			}
			e.stopPropagation();
		});

		_customButton.addEventListener("click", (e: Event) => {
			// do default styling
			// always display menu
			if (!_customButton.className.includes("active")) {
				_defaultButton.className = "button";
				_sepiaButton.className = "button";
				_redeyeButton.className = "button";
				_customButton.className = "button active";
				_handlePresetChange("original");
			}
			_toggleDarkConfigurator();
			e.stopPropagation();
		});

		_headerElement.addEventListener("click", (_e: Event) => {
			_hideDarkConfigurator();
		});

		_pdfElement.addEventListener(
			"click",
			(e: Event) => {
				_hideDarkConfigurator();
				e.stopPropagation();
			},
			true,
		);

		_splashElement.addEventListener("click", (_e: Event) => {
			window.api.openNewPDF(null);
		});

		_splashExtraElement.addEventListener("click", (_e: Event) => {
			window.api.openNewPDF(null);
		});

		window.addEventListener("blur", function () {
			const activeElement = document.activeElement;
			if (activeElement) {
				if (activeElement.id === "pdfjs") {
					_hideDarkConfigurator();
				}
			}
		});

		_splashElement.ondrop = (e: DragEvent) => {
			console.log("files dropped");
			e.preventDefault();
			e.stopPropagation();

			const files = e.dataTransfer?.files;

			if (!files || files.length === 0) {
				return;
			}

			const fileToOpen = files[0];
			if (fileToOpen) {
				_openFile(fileToOpen.path);
			}
		};
		_splashElement.ondragover = (e: Event) => {
			console.log("file dragged");
			e.preventDefault();
			e.stopPropagation();
		};
	}

	const _toggleDarkConfigurator = () => {
		if (_darkConfiguratorElement.style.visibility === "visible") {
			_darkConfiguratorElement.style.visibility = "hidden";
		} else {
			_darkConfiguratorElement.style.visibility = "visible";
		}
	};

	const _hideDarkConfigurator = () => {
		if (_darkConfiguratorElement.style.visibility === "visible") {
			_darkConfiguratorElement.style.visibility = "hidden";
		}
	};

	const _openFile = async (file: string) => {
		console.log("opening ", file);
		if (_pdfElement.src) {
			console.log("opening in new window");
			window.api.newWindow(file);
		} else {
			_appContainerElement.style.zIndex = "1";
			_pdfElement.src = `libs/pdfjs/web/viewer.html?file=${encodeURIComponent(
				file,
			)}#pagemode=none`;
			_pdfElement.onload = _fileDidLoad;
			await _updateTitle(file);
			//send message to update window size
		}
	};

	const _fileDidLoad = () => {
		console.log("Loaded PDF");
		_headerElement.style.visibility = "visible";
		window.api.togglePrinting(true);
		window.api.resizeWindow(null);
		_setupDarkMode();
		_setupSliders();
	};

	const _handlePresetChange = (preset: string) => {
		const brightness = _brightnessSliderElement.noUiSlider;
		const grayness = _grayscaleSliderElement.noUiSlider;
		const inversion = _invertSliderElement.noUiSlider;
		const sepia = _sepiaSliderElement.noUiSlider;
		const hue = _hueSliderElement.noUiSlider;
		const extraBrightness = _extraBrightnessSliderElement.noUiSlider;

		switch (preset) {
			case "default":
				brightness.set(7);
				grayness.set(95);
				inversion.set(95);
				sepia.set(55);
				hue.set(180);
				extraBrightness.set(0);
				break;
			case "original":
				brightness.set(0);
				grayness.set(0);
				inversion.set(0);
				sepia.set(0);
				hue.set(0);
				extraBrightness.set(0);
				break;
			case "redeye":
				brightness.set(8);
				grayness.set(100);
				inversion.set(92);
				sepia.set(100);
				hue.set(295);
				extraBrightness.set(-6);
				break;
			case "sepia":
				brightness.set(0);
				grayness.set(0);
				inversion.set(25);
				sepia.set(100);
				hue.set(0);
				extraBrightness.set(-30);
				break;
			default:
				brightness.set(9);
		}

		console.log(preset, "changed");
	};

	const _setupSliders = () => {
		noUiSlider.create(_brightnessSliderElement, {
			start: 7,
			step: 1,
			connect: "lower",
			range: {
				min: 0,
				max: 100,
			},
			tooltips: [
				{
					// 'to' the formatted value. Receives a number.
					to: function (value) {
						return `${Math.round(value)}%`;
					},
					// 'from' the formatted value.
					// Receives a string, should return a number.
					from: function (value) {
						return Number(value.replace("%", ""));
					},
				},
			],
		});

		noUiSlider.create(_grayscaleSliderElement, {
			start: 95,
			step: 1,
			connect: "lower",
			range: {
				min: 0,
				max: 100,
			},
			tooltips: [
				{
					// 'to' the formatted value. Receives a number.
					to: function (value) {
						return `${Math.round(value)}%`;
					},
					// 'from' the formatted value.
					// Receives a string, should return a number.
					from: function (value) {
						return Number(value.replace("%", ""));
					},
				},
			],
		});

		noUiSlider.create(_invertSliderElement, {
			start: 95,
			step: 1,
			connect: "lower",
			range: {
				min: 0,
				max: 100,
			},
			tooltips: [
				{
					// 'to' the formatted value. Receives a number.
					to: function (value) {
						return `${Math.round(value)}%`;
					},
					// 'from' the formatted value.
					// Receives a string, should return a number.
					from: function (value) {
						return Number(value.replace("%", ""));
					},
				},
			],
		});

		noUiSlider.create(_sepiaSliderElement, {
			start: 55,
			step: 1,
			connect: "lower",
			range: {
				min: 0,
				max: 100,
			},
			tooltips: [
				{
					// 'to' the formatted value. Receives a number.
					to: function (value: number) {
						return `${Math.round(value)}%`;
					},
					// 'from' the formatted value.
					// Receives a string, should return a number.
					from: function (value: string) {
						return Number(value.replace("%", ""));
					},
				},
			],
		});

		noUiSlider.create(_hueSliderElement, {
			start: 180,
			step: 1,
			connect: "lower",
			range: {
				min: 0,
				max: 360,
			},
			tooltips: [
				{
					// 'to' the formatted value. Receives a number.
					to: function (value: number) {
						return `${Math.round(value)}%`;
					},
					// 'from' the formatted value.
					// Receives a string, should return a number.
					from: function (value: string) {
						return Number(value.replace("°", ""));
					},
				},
			],
		});

		noUiSlider.create(_extraBrightnessSliderElement, {
			start: 0,
			step: 1,
			connect: "lower",
			range: {
				min: -100,
				max: 200,
			},
			tooltips: [
				{
					// 'to' the formatted value. Receives a number.
					to: function (value: number) {
						return `${Math.round(value)}%`;
					},
					// 'from' the formatted value.
					// Receives a string, should return a number.
					from: function (value: string) {
						return Number(value.replace("%", ""));
					},
				},
			],
		});

		const sliders = [
			_brightnessSliderElement,
			_grayscaleSliderElement,
			_invertSliderElement,
			_sepiaSliderElement,
			_hueSliderElement,
			_extraBrightnessSliderElement,
		];
		sliders.map((slider) => {
			const namespace = _brightnessSliderElement.id;
			const eventName = `update.${namespace}`;
			slider.noUiSlider.on(eventName, () => {
				updateCSS();
			});
		});
	};

	const _setupDarkMode = () => {
		const style = document.createElement("style");
		const content = _pdfElement.contentDocument;
		style.setAttribute("id", "pageStyle");
		style.textContent = "div#viewer .page {";
		style.textContent +=
			"filter: brightness(0.91) grayscale(0.95) invert(0.95) sepia(0.55) hue-rotate(180deg);";
		style.textContent += "border-image: none;";
		style.textContent += "}";
		if (content) {
			content.head.appendChild(style);
		}
	};

	const _updateDarkSettings = (cssFilter: string) => {
		const content = _pdfElement.contentDocument;
		if (content) {
			const currentStyle = content.getElementById("pageStyle");

			let cssRule;
			cssRule = "div#viewer .page {";
			cssRule += cssFilter;
			cssRule += "border-image: none;";
			cssRule += "}";

			if (currentStyle) {
				currentStyle.innerHTML = cssRule;
			}
		}
	};

	const updateCSS = () => {
		const brightness = _try(() => _brightnessSliderElement.noUiSlider.get(), 0);
		const grayness = _try(() => _grayscaleSliderElement.noUiSlider.get(), 0);
		const inversion = _try(() => _invertSliderElement.noUiSlider.get(), 0);
		const sepia = _try(() => _sepiaSliderElement.noUiSlider.get(), 0);
		const hue = _try(() => _hueSliderElement.noUiSlider.get(), 0);
		const extraBrightness = _try(
			() => _extraBrightnessSliderElement.noUiSlider.get(),
			0,
		);

		console.log(extraBrightness);
		let cssRule = "";
		cssRule += "filter: ";
		cssRule += `brightness(${(100 - brightness) / 100}) `;
		cssRule += `grayscale(${grayness / 100}) `;
		cssRule += `invert(${inversion / 100}) `;
		cssRule += `sepia(${sepia / 100}) `;
		cssRule += `hue-rotate(${hue}deg) `;
		cssRule += `brightness(${(Math.round(extraBrightness) + 100.0) / 100});`;

		console.log(cssRule);

		_updateDarkSettings(cssRule);
	};

	const _updateTitle = async (filePath: string) => {
		window.api.getPath(filePath).then((fileName) => {
			console.log(fileName);
			if (fileName) {
				_titleElement.innerHTML = fileName;
				document.title = fileName;
			} else {
				document.title = "NightPDF";
			}
		});
	};

	return {
		run: main,
	};
})();

nightPDF.run();
