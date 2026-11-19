import { useCallback, useEffect, useState } from 'react';
import type { Pack } from '../types';
import { addPack, EMPTY_ALBUM, loadAlbum, saveAlbum, type Album } from '../lib/collection';

export function useAlbum() {
  const [album, setAlbum] = useState<Album>(loadAlbum);

  useEffect(() => { saveAlbum(album); }, [album]);

  const record = useCallback((pack: Pack) => setAlbum((a) => addPack(a, pack)), []);
  const reset = useCallback(() => setAlbum(EMPTY_ALBUM), []);

  return { album, record, reset };
}
