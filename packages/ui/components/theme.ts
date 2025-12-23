import { 
    provideFluentDesignSystem, 
    fluentCard, 
    fluentButton, 
    fluentTextField,
    fluentSwitch
} from '@fluentui/web-components';

export function initializeTheme() {
    provideFluentDesignSystem()
        .register(
            fluentCard(),
            fluentButton(),
            fluentTextField(),
            fluentSwitch()
        );
}
