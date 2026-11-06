// The owner account has been provisioned. Keep the setup URL disabled.
Deno.serve(() => new Response(null, { status: 410 }));
