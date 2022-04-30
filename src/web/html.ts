import { RecursivePartial } from "../utils";

/* DSL-like helpers for generating html */
export namespace HTML {
	export function CreateElement<K extends keyof HTMLElementTagNameMap>(
		tagName: K,
		...modify: ((t: HTMLElementTagNameMap[K]) => void)[]): HTMLElementTagNameMap[K] {
		return ModifyElement(document.createElement(tagName), ...modify);
	}

	export function ModifyElement<T extends HTMLElement>(
		tag: T,
		...modify: ((t: T) => void)[]): T {
		modify.forEach(x => x(tag));
		return tag;
	}

	export function SetTitle(title: string) {
		return (elem: HTMLElement) => elem.title = title;
	}

	export function SetId(id: string) {
		return (elem: HTMLElement) => elem.id = id;
	}

	export function AddClass(className: string) {
		return (elem: HTMLElement) => elem.classList.add(className);
	}

	export function SetName(name: string) {
		return (input: HTMLInputElement) => input.name = name;
	}

	export function SetRequired(required = true) {
		return (input: HTMLInputElement | HTMLSelectElement) => input.required = required;
	}

	export function SetChecked(checked = true) {
		return (input: HTMLInputElement) => input.checked = checked;
	}

	export function SetInputType(type: string) {
		return (input: HTMLInputElement) => input.type = type;
	}

	export function SetNumberInputRange(min: number | undefined, max: number | undefined, step: number | undefined) {
		return (input: HTMLInputElement) => {
			input.min = min === undefined ? "any" : min.toString();
			input.max = max === undefined ? "any" : max.toString();
			input.step = step === undefined ? "any" : step.toString();
		}
	}

	export function SetText(text: string, title?: string) {
		return (el: HTMLElement) => {
			el.textContent = text;
			if (title)
				el.title = title;
		}
	}

	export function SetStyles(setter: (styles: CSSStyleDeclaration) => void) {
		return (el: HTMLElement) => setter(el.style);
	}

	export function FlexContainer(direction = "row", justifyContent = "", settings = { wrap: false }) {
		return SetStyles(style => {
			style.display = "flex";
			style.flexDirection = direction;
			style.justifyContent = justifyContent;
			style.flexWrap = settings.wrap ? "wrap" : "no-wrap"
		})
	}

	export function CreateSwitcher(currentState: () => boolean, changeState: (on: boolean) => void, titles: Record<"on" | "off", string>): HTMLButtonElement {
		const button = HTML.CreateElement("button", SetText(!currentState() ? titles.on : titles.off));
		const hide = () => {
			changeState(!currentState())
			button.innerText = !currentState() ? titles.on : titles.off;
		};
		return HTML.ModifyElement(button, AddEventListener("click", hide))
	}

	export function CreateSelector<T extends string, K extends T>(defaultKey: K, options: Record<T, string>, onChange: (value: T) => void) {
		return HTML.CreateElement("select",
			HTML.AddEventListener("change", function () {
				try {
					onChange(<T>(<HTMLSelectElement>this).value)
				} catch (e) {
					alert(`${e}`)
				}
			}),
			HTML.Append(...Object.entries(options).map(([value, text]) => HTML.CreateElement("option", HTML.SetText(text as string), (el) => el.value = value))),
			el => {
				el.selectedIndex = Object.keys(options).findIndex(k => k === defaultKey);
				onChange(defaultKey);
			}
		)
	}

	interface ForEachable<T> {
		forEach(each: (value: T) => void): void;
	}

	export function ModifyChildren(...modify: ((t: HTMLElement) => void)[]): (parent: HTMLElement) => void {
		return (parent) => {
			for (let i = 0; i < parent.children.length; i++) {
				const elem = parent.children.item(i);
				if (elem instanceof HTMLElement)
					ModifyElement(elem, ...modify);
			}
		}
	}

	export function Append<T extends HTMLElement>(...elems: T[]): (parent: HTMLElement) => void
	export function Append<T extends HTMLElement>(elems: ForEachable<T>): (parent: HTMLElement) => void
	export function Append<T extends HTMLElement>(...elems: (ForEachable<T> | HTMLElement)[]): (parent: HTMLElement) => void
	export function Append<T extends HTMLElement>(...elems: (ForEachable<T> | HTMLElement)[]): (parent: HTMLElement) => void {
		return (parent: HTMLElement) =>
			elems.forEach(value => {
				if (value instanceof HTMLElement) {
					parent.append(value);
				} else {
					value.forEach(elem => parent.append(elem));
				}
			})
	}

	export function AddEventListener<K extends keyof HTMLElementEventMap>(
		type: K,
		listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions
	) {
		return (el: HTMLElement) => {
			el.addEventListener(type, listener, options)
		}
	}
	export namespace Input {
		export type Description =
			{ type: "int" | "float", default: number, min?: number, max?: number, description?: string }
			| ObjectDescription
			| { type: "string", default: string, description?: string }
			| { type: "boolean", default: boolean, description?: string }
			| {
				type: "color", description?: string,
				/** только #RRGGBB в полной форме, слова не поддерживаются */
				default: string,
			}
			| {
				type: "enum", default: string, description?: string,
				/** Пары: название значения енума:отображаемое название в ui */
				values: Record<string, string>
			}
		export type ObjectDescription<T extends string = string> = { type: "object", values: Values<T>, description?: string }
		export type Values<T extends string> = Record<T, Description>
		export type ObjectType<I extends Values<string>> = {
			[Property in keyof I]: Type<I[Property]>
		};
		export type Type<I extends Description> =
			I["type"] extends "int" | "float" ? number :
			I["type"] extends "string" | "color" ? string :
			I["type"] extends "boolean" ? boolean :
			I["type"] extends "enum" ? string :
			I extends ObjectDescription ? ObjectType<I["values"]> :
			unknown;
		export function GetDefault<T extends Values<string>>(type: T): ObjectType<T> {
			const res = {} as ObjectType<T>
			CreateObjectInput(type, res);
			return res;
		}

		function CreateObjectInput<K extends string, D extends Values<K>>(desc: D, output: ObjectType<D>): HTMLElement {
			return CreateElement("ul", Append(
				Entries(desc).
					map(([name, type]) => CreateElement("li", Append(
						CreateElement("label", SetText(name as string, type.description || name as string), (el) => el.htmlFor = name as string),
						CreateTypedInput(name as string, type, (value) => output[name as keyof ObjectType<D>] = value as ObjectType<D>[keyof ObjectType<D>], output[name]))))
			));
		}
		/** output - в этот объект будут попадать значения по мере заполнения полей инпута
		 * Если в нём есть заполненные поля - они займут место дефолтных
		 */
		function CreateTypedInput<K extends string, T extends Description>(name: K, type: T, onChange: (value: Type<T>) => void, defaultOverride: Type<T> | undefined, required = true): HTMLElement {
			// if (type.type !== "object" && onChange[name] === undefined) {
			// onChange[name] = type.default as any;
			// }
			switch (type.type) {
				case "boolean":
				case "string":
				case "int":
				case "float":
				case "color":
					onChange(defaultOverride || type.default as Type<T>);
					return CreateElement("input",
						SetName(name),
						SetId(name),
						SetTitle(type.description || name),
						SetRequired(required),
						AddEventListener("change", function (ev: Event) {
							onChange(getValue(this as HTMLInputElement) as Type<T>);
						}),
						...additionalModifiers(type), setValue.bind(null, type, or(defaultOverride, type.default as Type<T>)));
				case "enum":
					onChange(defaultOverride || type.default as Type<T>);
					return HTML.ModifyElement(CreateSelector(or(defaultOverride as string, type.default), type.values, onChange as any), SetTitle(type.description || name), SetId(name));
				case "object":
					const innerOutput = (defaultOverride || {}) as any;
					onChange(innerOutput)
					return CreateObjectInput(type.values, innerOutput);
			}
		}
		export function CreateForm<T extends Values<string>>(
			description: T,
			buttons: Record<string, (input: ObjectType<T>, actualize: (values: ObjectType<T>) => void) => void>,
			clickButton?: string,
			defaults?: RecursivePartial<ObjectType<T>>): HTMLElement {
			let output = (defaults || {}) as ObjectType<T>;
			const h = CreateObjectInput(description, output);
			let lastClickedButton = clickButton;
			const inputContainer = HTML.CreateElement("section", HTML.Append(h), HTML.SetStyles(s => s.width = "286px"), HTML.AddEventListener("click", hideChildOf("li")));
			const form = HTML.CreateElement("form", HTML.AddClass("settings-input"), HTML.Append(
				HTML.CreateElement("header"),
				inputContainer));
			return HTML.ModifyElement(form, HTML.Append(
				HTML.CreateElement("footer", HTML.FlexContainer("row", "space-around", { wrap: true }), HTML.SetStyles(s => s.width = "286px"),
					HTML.Append(Object.keys(buttons).map((text) =>
						HTML.CreateElement("input", HTML.SetInputType("submit"), HTML.SetStyles(s => { s.flex = "1"; s.margin = "8px" }),
							HTML.AddEventListener("click",
								() => { lastClickedButton = text; }),
							(el) => { el.value = text; if (text === clickButton) setTimeout(() => el.click()) })
					)))
			), HTML.AddEventListener("submit", (ev) => {
				ev.preventDefault();
				if (lastClickedButton) {
					buttons[lastClickedButton](Copy(output), (actual) => {
						inputContainer.innerHTML = "";
						output = Copy(actual);
						inputContainer.append(CreateObjectInput(description, output));
					});
				}
			}));
		}

		function additionalModifiers(type: Description) {
			switch (type.type) {
				case "float":
					return [
						SetInputType("number"),
						SetNumberInputRange(or(type.min, Number.MIN_SAFE_INTEGER), or(type.max, Number.MAX_SAFE_INTEGER), 0.001)
					];
				case "int":
					return [
						SetInputType("number"),
						SetNumberInputRange(or(type.min, Number.MIN_SAFE_INTEGER), or(type.max, Number.MAX_SAFE_INTEGER), 1)
					];
				case "boolean":
					return [HTML.SetRequired(false), HTML.SetInputType("checkbox")];
				case "color":
					return [SetInputType("color")]
			}
			return [];
		}
		function getValue(input: HTMLInputElement) {
			switch (input.type) {
				case "number": return input.valueAsNumber;
				case "radio":
				case "checkbox": return input.checked;
				default: return input.value;
			}
		}
		function setValue(type: Description, value: any, input: HTMLInputElement) {
			switch (type.type) {
				case "int":
				case "float":
					input.valueAsNumber = value;
					return;
				case "color":
				case "string":
					input.value = value;
					return;
				case "boolean":
					input.checked = value;
					return
			}
		}
	}
}

function or<T>(x: T | undefined, y: T): T {
	return x === undefined ? y : x;
}

function Copy<T>(c: T): T {
	return JSON.parse(JSON.stringify(c)) as T;
}

function hideChildOf<K extends keyof HTMLElementTagNameMap>(tagName: K) {
	return (ev: MouseEvent) => {
		const target = ev.target as HTMLElement;
		if (ev.button === 0 && target.tagName.toLowerCase() === tagName.toLowerCase()) {
			const className = "hideChilds";
			if (target.classList.contains(className))
				target.classList.remove(className);
			else
				target.classList.add(className);
		}
	}
};

export function GetStyleSheet(): Promise<CSSStyleSheet> {
	return new Promise((resolve, reject) => {
		document.head.appendChild(HTML.CreateElement("style",
			(style: HTMLStyleElement) => {
				setTimeout(() => {
					const styleSheet = style.sheet;
					if (!styleSheet) {
						reject(new Error("Can't take style sheet"));
						return
					}
					styleSheet.addRule(`*`, `margin: 0; padding: 0;`);
					resolve(styleSheet);
				});
			}))
	})
}


function Entries<T>(obj: T): [keyof T, T[keyof T]][] {
	return Object.entries(obj) as [keyof T, T[keyof T]][]
}
