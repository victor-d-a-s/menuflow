export const runtime = 'edge';

import { createClient as createAdminClient } from '@supabase/supabase-js';

export default async function WebhooksPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Logs de Webhooks</h1>
      </div>
      
      <div className="border rounded-lg bg-card shadow-sm">
        <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[400px]">
          <h3 className="font-semibold text-lg">Nenhum log encontrado</h3>
          <p className="text-muted-foreground max-w-sm">
            Os registros de comunicação do MenuFlow com sistemas externos aparecerão aqui.
          </p>
        </div>
      </div>
    </div>
  );
}
