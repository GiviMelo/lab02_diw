import { getSessao } from '../auth.js';

window.location.replace(getSessao() ? 'frota.html' : 'login.html');
