interface EventsSource {
    addEventListener(event: 'keyup' | 'keydown', listener: (ev: KeyboardEvent) => void): void
}

export class Keyboard<T extends string> {
    totalPressed = 0
    keys: Record<T, boolean>
    constructor(mapping: Record<string, T>, parent: EventsSource = window) {
        const keys = Object.values(mapping);
        this.keys = Object.fromEntries(keys.map(key => ([key, false]))) as Record<T, boolean>;
        parent.addEventListener('keydown', (ev) => {
            const action = mapping[ev.code];
            if (action) {
                ev.preventDefault();
                if (!this.keys[action]) {
                    this.keys[action] = true;
                    ++this.totalPressed;
                }
            }
        })
        parent.addEventListener('keyup', (ev) => {
            const action = mapping[ev.code];
            if (action) {
                ev.preventDefault();
                if (this.keys[action]) {
                    this.keys[action] = false;
                    --this.totalPressed;
                }
            }
        })
    }
}
