import { css, customElement, FASTElement, html, observable } from '@microsoft/fast-element';

const styles = css`
    :host {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        pointer-events: none;
    }
    
    .toast {
        background: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        margin-top: 10px;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 200px;
    }

    .toast.visible {
        opacity: 1;
        transform: translateY(0);
    }

    .type-success {
        border-left: 4px solid #107c10;
    }

    .type-error {
        border-left: 4px solid #d13438;
    }

    .type-info {
        border-left: 4px solid #0078d4;
    }
`;

type NotificationType = 'success' | 'error' | 'info';

const template = html<NotificationComponent>`
    <div class="toast ${x => x.visible ? 'visible' : ''} type-${x => x.type}">
        <span class="message">${x => x.message}</span>
    </div>
`;

@customElement({
    name: 'ui-notification',
    template,
    styles
})
export class NotificationComponent extends FASTElement {
    @observable visible = false;
    @observable message = '';
    @observable type: NotificationType = 'info';

    private timeout: number | undefined;

    show(message: string, type: NotificationType = 'info', duration = 3000) {
        this.message = message;
        this.type = type;
        this.visible = true;

        if (this.timeout) clearTimeout(this.timeout);
        
        this.timeout = setTimeout(() => {
            this.visible = false;
        }, duration);
    }
}
