export class Notice {
	constructor(message: string) {
		mockNotice(message);
	}
}

export const mockNotice = jest.fn<void, [string]>();
