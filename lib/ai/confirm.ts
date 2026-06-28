const AUTO_APPROVED_ACTIONS = ['getDashboardSummary', 'getUpcomingBills'];

export async function confirmIfNeeded(
  action: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  void payload;

  const interactive = process.env.INTERACTIVE === 'true';

  if (interactive) {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise<boolean>((resolve) => {
      rl.question(`Confirmar acao "${action}"? (s/n): `, (answer: string) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === 's');
      });
    });
  }

  return AUTO_APPROVED_ACTIONS.includes(action);
}
