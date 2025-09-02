import { createSelector } from 'reselect';
import { selectTokenSortConfig } from './preferencesController';
import { selectIsEvmNetworkSelected } from './multichainNetworkController';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { selectSelectedInternalAccount } from './accountsController';
///: END:ONLY_INCLUDE_IF

import {
  selectEvmTokens,
  selectEvmTokenFiatBalances,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  selectMultichainTokenListForAccountId,
  ///: END:ONLY_INCLUDE_IF
} from './multichain';
import { RootState } from '../reducers';
import { TokenI } from '../components/UI/Tokens/types';
import { sortAssets } from '../components/UI/Tokens/util';
import { TraceName, endTrace, trace } from '../util/trace';
import { getTraceTags } from '../util/sentry/tags';
import { store } from '../store';
import { createDeepEqualSelector } from './util';
import { selectFavoriteTokens } from '../core/redux/slices/favoriteTokens';

const _selectSortedTokenKeys = createSelector(
  [
    selectEvmTokens,
    selectEvmTokenFiatBalances,
    selectIsEvmNetworkSelected,
    selectTokenSortConfig,
    selectFavoriteTokens,
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    (state: RootState) => {
      const selectedAccount = selectSelectedInternalAccount(state);
      return selectMultichainTokenListForAccountId(state, selectedAccount?.id);
    },
    ///: END:ONLY_INCLUDE_IF
  ],
  (
    evmTokens,
    tokenFiatBalances,
    isEvmSelected,
    tokenSortConfig,
    favoriteTokens,
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    nonEvmTokens,
    ///: END:ONLY_INCLUDE_IF
  ) => {
    trace({
      name: TraceName.Tokens,
      tags: getTraceTags(store.getState()),
    });

    const tokenListData = isEvmSelected ? evmTokens : nonEvmTokens;

    const tokensWithBalances: TokenI[] = tokenListData.map((token, i) => {
      const staked = (token as { isStaked?: boolean }).isStaked
        ? 'staked'
        : 'unstaked';
      const tokenId = `${token.address}-${token.chainId}-${staked}`;
      const isFavorite = favoriteTokens.has(tokenId);

      return {
        ...token,
        tokenFiatAmount: isEvmSelected
          ? tokenFiatBalances[i]
          : token.balanceFiat,
        isFavorite,
      };
    });

    const tokensSorted = sortAssets(tokensWithBalances, tokenSortConfig);

    endTrace({ name: TraceName.Tokens });

    return tokensSorted.map(({ address, chainId, isStaked }) => ({
      address,
      chainId,
      isStaked,
    }));
  },
);

// Deep equal selector is necessary, because prices can change little bit but order of tokens stays the same.
// So if the previous keys are still valid (deep eq the current list), then we can use the memoized result
export const selectSortedTokenKeys = createDeepEqualSelector(
  _selectSortedTokenKeys,
  (keys) => keys.filter(({ address, chainId }) => address && chainId),
);
