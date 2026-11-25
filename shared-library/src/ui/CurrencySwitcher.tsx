import { MenuItem, TextField } from '@mui/material';
import { availableDisplayCurrencies, chooseDisplayCurrency, displayCurrency } from './money';

/**
 * Lets a person show every screen in another of the business's currencies. Shown only when the business offers more
 * than one. Amounts are converted for display; the page reloads so every application picks the new currency up.
 */
export function CurrencySwitcher({ dark = false }: { dark?: boolean }) {
  const choices = availableDisplayCurrencies();
  if (choices.length < 2) return null;
  return (
    <TextField select size="small" value={displayCurrency()} aria-label="Display currency"
      onChange={(event) => { chooseDisplayCurrency(event.target.value); window.location.reload(); }}
      sx={{ minWidth: 92, '& .MuiInputBase-root': { height: 36, fontWeight: 700, color: dark ? '#fff' : undefined },
        '& fieldset': { borderColor: dark ? 'rgba(255,255,255,0.3)' : undefined }, '& svg': { color: dark ? '#fff' : undefined } }}>
      {choices.map((code) => <MenuItem key={code} value={code}>{code}</MenuItem>)}
    </TextField>
  );
}
