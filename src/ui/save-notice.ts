/** Persistent storage feedback, separate from the transient gameplay toast. */
export class SaveNotice {
  readonly el = document.createElement('aside');
  private message: HTMLElement;
  private dismiss: HTMLButtonElement;

  constructor(download: () => void) {
    this.el.className = 'save-notice';
    this.el.hidden = true;
    this.el.setAttribute('role', 'alert');
    this.el.innerHTML = '<p></p><div><button type="button" class="btn" data-download>Download progress</button><button type="button" class="btn" data-dismiss>Dismiss</button></div>';
    this.message = this.el.querySelector('p')!;
    this.dismiss = this.el.querySelector('[data-dismiss]')!;
    this.el.querySelector('[data-download]')!.addEventListener('click', download);
    this.dismiss.onclick = () => { this.el.hidden = true; };
  }

  show(message: string, canDismiss: boolean) {
    this.message.textContent = message;
    this.dismiss.hidden = !canDismiss;
    this.el.hidden = false;
  }

  hide() { this.el.hidden = true; }
}
