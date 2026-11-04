import * as MaterialDesign from 'react-icons/md';
import tailwindBtn from './tailwindBtn';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { formatDatenstand } from '../utils/detailData';

/**
 * Kleiner Hinweis, solange die App ohne Verbindung zum Server läuft.
 * Zeigt, von wann die angezeigten (zwischengespeicherten) Daten stammen.
 */
function OfflineBanner() {
  const { offline, lastSync } = useOnlineStatus();
  if (!offline) return null;
  const stand = formatDatenstand(lastSync);
  return (
    <div className={tailwindBtn.appLayout.offlineBanner} role="status" aria-live="polite" data-testid="offline-banner">
      <MaterialDesign.MdCloudOff className="text-lg shrink-0" aria-hidden="true" />
      <span>
        {stand
          ? <>Offline – angezeigte Daten vom {stand}</>
          : <>Offline – angezeigte Daten aus dem Zwischenspeicher</>}
      </span>
    </div>
  );
}

export default OfflineBanner;
