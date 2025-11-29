import React from 'react';
import { render } from '@testing-library/react-native';

const mockUseAuth = jest.fn();
jest.mock('@clerk/clerk-expo', () => ({
	useAuth: () => mockUseAuth(),
}));

jest.mock('axios', () => {
	let savedOnFulfilled: any = null;
	const mockUseLocal = (onFulfilled: any) => {
		savedOnFulfilled = onFulfilled;
		return 1;
	};

	const instance = {
		interceptors: {
			request: {
				use: mockUseLocal,
			},
		},
	};

		const create = jest.fn(() => instance);
		const defaultExport = { create };
		return {
			default: defaultExport,
			create,
			__getSavedOnFulfilled: () => savedOnFulfilled,
			__esModule: true,
		};
});

import { AXIOS_BEARER } from '@/constants/hook-constants';
import { useAxiosWithClerk } from '@/hooks/use-axios-clerk';

function TestComp() {
	useAxiosWithClerk();
	return null;
}

beforeEach(() => {
	jest.clearAllMocks();
});

test('attaches interceptor and sets Authorization header when token exists', async () => {
	const getToken = jest.fn().mockResolvedValue('token-123');
	mockUseAuth.mockReturnValue({ getToken });

		render(React.createElement(TestComp));

		const axios = require('axios');
		expect(axios.create).toHaveBeenCalledWith({ baseURL: process.env.EXPO_PUBLIC_API_BASE_URL });

		const saved = axios.__getSavedOnFulfilled();
		expect(typeof saved).toBe('function');

		const config: any = { headers: {} };
		await saved(config);

	expect(config.headers.Authorization).toBe(`${AXIOS_BEARER} token-123`);
});

test('attaches interceptor and does not set Authorization when no token', async () => {
	const getToken = jest.fn().mockResolvedValue(null);
	mockUseAuth.mockReturnValue({ getToken });

		render(React.createElement(TestComp));

		const axios = require('axios');
		expect(axios.create).toHaveBeenCalled();

		const saved = axios.__getSavedOnFulfilled();
		const config: any = { headers: {} };
		await saved(config);
	expect(config.headers.Authorization).toBeUndefined();
});

