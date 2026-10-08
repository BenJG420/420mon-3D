export type MovementInput = { forward: number; right: number; sprint: boolean };
export class GameInput {
  private pressed = new Set<string>();
  constructor() {
    window.addEventListener('keydown', this.down);
    window.addEventListener('keyup', this.up);
    window.addEventListener('blur', this.clear);
  }
  private down = (event: KeyboardEvent) => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code)) event.preventDefault();
    this.pressed.add(event.code);
  };
  private up = (event: KeyboardEvent) => this.pressed.delete(event.code);
  private clear = () => this.pressed.clear();
  get movement(): MovementInput {
    const has = (a: string, b?: string) => this.pressed.has(a) || (b ? this.pressed.has(b) : false);
    return {
      forward: Number(has('KeyW','ArrowUp')) - Number(has('KeyS','ArrowDown')),
      right: Number(has('KeyD','ArrowRight')) - Number(has('KeyA','ArrowLeft')),
      sprint: has('ShiftLeft','ShiftRight')
    };
  }
  dispose() {
    window.removeEventListener('keydown', this.down);
    window.removeEventListener('keyup', this.up);
    window.removeEventListener('blur', this.clear);
  }
}
