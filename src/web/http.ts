import { HTML } from "./html";

export function getJSON<T = any>(url: string): Promise<T> {
	return fetch(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json"
		}
	}).then(r => r.json()) as Promise<T>
}

export function loadImage(url: string): Promise<CanvasImageSource> {
	return new Promise(function (resolve, reject) {
		let img = new Image();
		img.onload = function () {
			return resolve(img);
		};
		img.onerror = function () {
			return reject(name);
		};
		img.src = url;
	});
}

export function ReadJSONsFromUserFiles(): Promise<any[]> {
	return new Promise((resolve) => {
		HTML.CreateElement("input", HTML.SetInputType("file"), el => el.multiple = true, HTML.AddEventListener("change", function () {
			const files = (<HTMLInputElement>this).files;
			if (files == null)
				return;
			resolve(Promise.all(Array.prototype.slice.call(files).map(x => fileAsText(x).then(PromiseParseJSON))));
		})).click();
	})
}

export function fileAsText(file: File): Promise<string> {
	return new Promise<string>(function (resolve, reject) {
		const fileReader = new FileReader();
		fileReader.addEventListener("load", (ev) => {
			resolve(fileReader.result as string)
		});
		fileReader.addEventListener("error", reject);
		fileReader.readAsText(file);
	})
}

export function PromiseParseJSON(string: string) {
	return new Promise((ok, err) => {
		try {
			ok(JSON.parse(string));
		} catch (e) {
			err(e);
		}
	})
}


export function LinkToDownloadJSON(filename: string, obj: any): HTMLAnchorElement {
	const json = JSON.stringify(obj);
	const blob = new Blob([json], { type: "application/json" });
	const a = document.createElement("a");
	a.download = `${filename}.json`;
	a.href = URL.createObjectURL(blob);
	return a;
}

export function downloadAsFile(filename: string, body: any) {
	const a = LinkToDownloadJSON(filename, body);
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(a.href);
}