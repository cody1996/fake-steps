import { createApp } from 'vue';
import App from './App.vue';
import './styles/base.css';

const params = new URLSearchParams(location.search);

if (params.get('capture') === 'selftest') {
  const root = document.getElementById('app');
  import('./selftest')
    .then(({ runSelfTest }) => runSelfTest())
    .catch((e) => {
      if (root) {
        root.style.cssText = 'font:13px/1.5 monospace;padding:10px;color:#b00;white-space:pre-wrap';
        root.textContent = 'SELFTEST ERROR:\n' + String(e) + '\n' + (e instanceof Error ? e.stack : '');
      }
    });
} else {
  createApp(App).mount('#app');
}
