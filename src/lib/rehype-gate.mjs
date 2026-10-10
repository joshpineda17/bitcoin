// Wraps everything after a `<!-- gate -->` comment in <div data-gate-cerrado>,
// so the article page can hide it until the reader unlocks the story.
const esMarca = (nodo) =>
  (nodo.type === 'comment' && nodo.value.trim() === 'gate') ||
  (nodo.type === 'raw' && /^<!--\s*gate\s*-->$/.test(nodo.value.trim()));

export function rehypeGate() {
  return (arbol) => {
    const i = arbol.children.findIndex(esMarca);
    if (i === -1) return;
    const resto = arbol.children.splice(i + 1);
    arbol.children.splice(i, 1, {
      type: 'element',
      tagName: 'div',
      properties: { dataGateCerrado: '' },
      children: resto,
    });
  };
}
