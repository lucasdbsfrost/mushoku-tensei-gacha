import type { Card, Pack } from '../types';

/*
 * L'album est gardé dans le navigateur du visiteur (localStorage).
 * Rien n'est envoyé nulle part. Si le stockage est bloqué (navigation
 * privée, réglages), le site marche quand même, sans sauvegarde.
 */
const KEY = 'mt-gacha:album:v2';

export interface Album {
  /** Nombre d'exemplaires obtenus, par numéro de carte. */
  owned: Record<string, number>;
  packs: number;
  godPacks: number;
}

export const EMPTY_ALBUM: Album = { owned: {}, packs: 0, godPacks: 0 };

export function loadAlbum(): Album {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_ALBUM;
    const data = JSON.parse(raw) as Partial<Album>;
    // Données venues du navigateur : on ne garde que ce qui a la bonne forme.
    const owned: Record<string, number> = {};
    for (const [k, v] of Object.entries(data.owned ?? {})) {
      if (typeof k === 'string' && Number.isInteger(v) && (v as number) > 0) owned[k] = v as number;
    }
    return {
      owned,
      packs: Number.isInteger(data.packs) ? (data.packs as number) : 0,
      godPacks: Number.isInteger(data.godPacks) ? (data.godPacks as number) : 0,
    };
  } catch {
    return EMPTY_ALBUM;
  }
}

export function saveAlbum(album: Album): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(album));
  } catch {
    /* stockage indisponible : l'album vit le temps de la visite */
  }
}

export function addPack(album: Album, pack: Pack): Album {
  const owned = { ...album.owned };
  for (const { card } of pack.cards) owned[card.cardNo] = (owned[card.cardNo] ?? 0) + 1;
  return {
    owned,
    packs: album.packs + 1,
    godPacks: album.godPacks + (pack.isGodPack ? 1 : 0),
  };
}

export interface AlbumStats {
  distinct: number;
  total: number;
  superRares: number;
  doubles: number;
}

export function statsOf(album: Album, cards: Card[]): AlbumStats {
  let distinct = 0, total = 0, superRares = 0;
  for (const card of cards) {
    const n = album.owned[card.cardNo] ?? 0;
    if (n > 0) distinct++;
    total += n;
    if (card.rarity === 'SR' || card.rarity === 'SRP') superRares += n;
  }
  return { distinct, total, superRares, doubles: total - distinct };
}
