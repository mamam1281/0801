import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// mock unifiedApi used by the component (use relative path so jest resolver finds it)
jest.mock('../../lib/unifiedApi', () => ({
  api: {
    get: jest.fn(),
  },
}));

import { api } from '../../lib/unifiedApi';
import ProfileHistory from '../ProfileHistory';

describe('ProfileHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and displays transactions when "더 불러오기" clicked', async () => {
    const sample = [
      {
        product_id: 1,
        amount: 100,
        status: 'ok',
        receipt_code: 'r1',
        created_at: new Date().toISOString(),
      },
    ];

    api.get.mockResolvedValueOnce(sample);

    render(<ProfileHistory />);

    const loadBtn = screen.getByText(/더 불러오기/);
    fireEvent.click(loadBtn);

    await waitFor(() => {
      expect(screen.getByText(/제품:/)).toBeInTheDocument();
    });

    expect(screen.getByText(/100/)).toBeInTheDocument();
  });
});
// end of file
