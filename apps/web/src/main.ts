import {
  fluentButton,
  fluentCard,
  fluentDivider,
  fluentTextField,
  provideFluentDesignSystem,
} from '@fluentui/web-components';
import './app.ts';

provideFluentDesignSystem()
  .register(
    fluentCard(),
    fluentButton(),
    fluentTextField(),
    fluentDivider(),
  );
