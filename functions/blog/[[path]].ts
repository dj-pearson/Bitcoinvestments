/**
 * /blog/* is rendered in the browser (live or database data): serve the
 * prerendered file when one exists, otherwise the SPA shell. See
 * functions/lib/shell.ts.
 */
import { prerenderedOrShell, type PageContext } from '../lib/shell';

export const onRequestGet = (context: PageContext) => prerenderedOrShell(context);
