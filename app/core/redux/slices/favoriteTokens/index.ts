import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';
import { RootState } from '../../../../reducers';

export interface TokenIdentifier {
  address: string;
  chainId: string;
  isStaked?: boolean;
}

export interface FavoriteTokensState {
  favoriteTokens: Set<string>;
}

export const initialState: FavoriteTokensState = {
  favoriteTokens: new Set(),
};

const serializeTokenId = (token: TokenIdentifier): string => {
  const staked = token.isStaked ? 'staked' : 'unstaked';
  return `${token.address}-${token.chainId}-${staked}`;
};

const deserializeTokenId = (serialized: string): TokenIdentifier => {
  const parts = serialized.split('-');
  const isStaked = parts[parts.length - 1] === 'staked';
  const chainId = parts[parts.length - 2];
  const address = parts.slice(0, -2).join('-');
  return { address, chainId, isStaked };
};

const name = 'favoriteTokens';

const slice = createSlice({
  name,
  initialState,
  reducers: {
    addFavoriteToken: (state, action: PayloadAction<TokenIdentifier>) => {
      const tokenId = serializeTokenId(action.payload);
      state.favoriteTokens.add(tokenId);
    },
    removeFavoriteToken: (state, action: PayloadAction<TokenIdentifier>) => {
      const tokenId = serializeTokenId(action.payload);
      state.favoriteTokens.delete(tokenId);
    },
    toggleFavoriteToken: (state, action: PayloadAction<TokenIdentifier>) => {
      const tokenId = serializeTokenId(action.payload);
      if (state.favoriteTokens.has(tokenId)) {
        state.favoriteTokens.delete(tokenId);
      } else {
        state.favoriteTokens.add(tokenId);
      }
    },
    clearFavoriteTokens: (state) => {
      state.favoriteTokens.clear();
    },
    setFavoriteTokensFromArray: (state, action: PayloadAction<string[]>) => {
      state.favoriteTokens = new Set(action.payload);
    },
  },
});

const { actions, reducer } = slice;

export default reducer;

export const favoriteTokensTransform = {
  in: (inboundState: { favoriteTokens?: string[] } | null) => {
    if (
      inboundState?.favoriteTokens &&
      Array.isArray(inboundState.favoriteTokens)
    ) {
      return {
        ...inboundState,
        favoriteTokens: new Set(inboundState.favoriteTokens),
      };
    }
    return inboundState;
  },
  out: (outboundState: FavoriteTokensState) => ({
      ...outboundState,
      favoriteTokens: Array.from(outboundState.favoriteTokens),
    }),
};

const selectFavoriteTokensState = (state: RootState) => state[name];

export const selectFavoriteTokens = createSelector(
  selectFavoriteTokensState,
  (favoriteTokensState) => favoriteTokensState.favoriteTokens,
);

export const selectIsFavoriteToken = createSelector(
  [selectFavoriteTokens, (_: RootState, token: TokenIdentifier) => token],
  (favoriteTokens, token) => {
    const tokenId = serializeTokenId(token);
    return favoriteTokens.has(tokenId);
  },
);

export const selectFavoriteTokensList = createSelector(
  selectFavoriteTokens,
  (favoriteTokens) => Array.from(favoriteTokens).map(deserializeTokenId),
);

export const selectFavoriteTokensCount = createSelector(
  selectFavoriteTokens,
  (favoriteTokens) => favoriteTokens.size,
);

export const {
  addFavoriteToken,
  removeFavoriteToken,
  toggleFavoriteToken,
  clearFavoriteTokens,
  setFavoriteTokensFromArray,
} = actions;
