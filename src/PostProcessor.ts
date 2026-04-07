import axios from "axios";
import { PostProcessingProvider } from "./SettingsManager";

export interface PostProcessorConfig {
	apiKey: string;
	model: string;
	url: string;
	provider: PostProcessingProvider;
}

export class PostProcessor {
	private config: PostProcessorConfig;

	constructor(config: PostProcessorConfig) {
		this.config = config;
	}

	async process(text: string, prompt: string): Promise<string> {
		if (this.config.provider === "anthropic") {
			return this.callAnthropic(text, prompt);
		}
		return this.callOpenAI(text, prompt);
	}

	private async callOpenAI(text: string, prompt: string): Promise<string> {
		const response = await axios.post(
			this.config.url,
			{
				model: this.config.model,
				messages: [
					{ role: "system", content: prompt },
					{ role: "user", content: text },
				],
			},
			{
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`,
					"Content-Type": "application/json",
				},
			}
		);
		return response.data.choices[0].message.content.trim();
	}

	private async callAnthropic(text: string, prompt: string): Promise<string> {
		const response = await axios.post(
			this.config.url,
			{
				model: this.config.model,
				max_tokens: 8192,
				system: prompt,
				messages: [{ role: "user", content: text }],
			},
			{
				headers: {
					"x-api-key": this.config.apiKey,
					"anthropic-version": "2023-06-01",
					"anthropic-dangerous-direct-browser-access": "true",
					"Content-Type": "application/json",
				},
			}
		);
		return response.data.content[0].text;
	}
}
