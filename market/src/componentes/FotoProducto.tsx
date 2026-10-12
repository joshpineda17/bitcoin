// Product photo at a fixed 4:3, or a flat block in a brand colour picked from the category,
// with the product's first letter large. Photos come from a storage URL, so plain img with lazy loading.
const COLORES = ['foto--criollo', 'foto--grano', 'foto--chocolate', 'foto--mazorca'] as const;

export function FotoProducto({
  src,
  nombre,
  categoriaId,
}: {
  src: string | null;
  nombre: string;
  categoriaId: number;
}) {
  if (src) {
    return (
      <img
        className="foto"
        src={src}
        alt={nombre}
        width={800}
        height={600}
        loading="lazy"
        decoding="async"
      />
    );
  }

  const inicial = nombre.trim().charAt(0).toLocaleUpperCase('es-SV');
  const color = COLORES[Math.abs(categoriaId) % COLORES.length];
  // The letter repeats the name next to it, so the block is hidden from assistive technology.
  return (
    <div className={`foto foto--sin ${color}`} aria-hidden="true">
      <span>{inicial}</span>
    </div>
  );
}
