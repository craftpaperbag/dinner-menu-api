export interface Env {
	ANTHROPIC_API_KEY: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response('POST only', { status: 405 });
		}

		const { memoBody } = (await request.json()) as { memoBody: string };

		const prompt = `以下は我が家の家族構成(family)、メニューの制約事項(constraints)、そして過去の夕飯記録(menu)です。これを参考に、今週の夕飯の叩き台を5案提案してください。

${memoBody}

- 出力は番号付きリスト形式
- 説明文は不要`;

		const res = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-api-key': env.ANTHROPIC_API_KEY,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model: 'claude-sonnet-4-6',
				max_tokens: 1024,
				messages: [{ role: 'user', content: prompt }],
			}),
		});

		const data = (await res.json()) as { content: { text: string }[] };
		const menus = data.content[0].text;

		return new Response(JSON.stringify({ menus }), {
			headers: { 'content-type': 'application/json' },
		});
	},
};
