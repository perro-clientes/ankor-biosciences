-- Notas al pie de la plantilla v1, tomadas del COA del Lote X (LE260008).
-- Mismo texto que DEFAULT_FOOTNOTES en lib/pdf/coa-defaults.ts.
-- Correr en el SQL Editor después de 20261108000000_coa_platform.sql.

update public.templates
   set footnotes = '** Total Cannabinoids = Neutral Cannabinoids + (Acidic Cannabinoids * 0.877)
** Total THC = Delta-10-THC + Delta-8-THC + (Delta-8-THCA x 0.877) + Delta-9-THC + THC-O-acetate + (THCA ×0.877)
** Total CBD = CBD + (CBDA x 0.877)
NR= Not Reported, ND= Not Detected, *Reported by Dry Mass*; *analytical instrumentation used Cannabinoids: UHPLC-DAD, Moisture: Mass by Drying, Water Activity: Water Activity Meter, Foreign: Microscope*
*Density tested at a temperature range between 19-24 °C, *Water Activity tested at a humidity range between 0-90% Relative Humidity.
All OA samples are sampled by the client, All California State Compliant samples sampled using SAMPL-SOP-001.'
 where version = 1;
