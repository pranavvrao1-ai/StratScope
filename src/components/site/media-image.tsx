import Image, { type ImageProps } from "next/image";

/**
 * next/image wrapper: optimises local files and this project's Supabase
 * Storage media; anything else (e.g. a hot-linked https image chosen by an
 * editor) is rendered without the optimiser so it never breaks.
 */
export function MediaImage({ src, alt, ...rest }: ImageProps & { src: string }) {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const optimisable = src.startsWith("/") || (!!supabase && src.startsWith(`${supabase}/storage/v1/object/public/`));
  return <Image src={src} alt={alt} unoptimized={!optimisable} {...rest} />;
}
