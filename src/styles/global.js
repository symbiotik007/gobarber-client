import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: #120f18;
    color: #f4ede8;
    font-family: 'Inter', 'Roboto Slab', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  button { cursor: pointer; }

  a { text-decoration: none; color: inherit; }

  input, button, textarea {
    font-family: 'Roboto Slab', serif;
  }
`;
