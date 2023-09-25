// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { objArg } from '../../utils';
import { lock } from '../kiosk';
import { type RuleResolvingParams } from '../../types';

/**
 * A helper to resolve the royalty rule.
 */
export function resolveRoyaltyRule(params: RuleResolvingParams) {
	const { transactionBlock: txb, itemType, price, packageId, transferRequest, policyId } = params;

	const policyObj = objArg(txb, policyId);

	// calculates the amount
	const [amount] = txb.moveCall({
		target: `${packageId}::royalty_rule::fee_amount`,
		typeArguments: [itemType],
		arguments: [policyObj, objArg(txb, price ?? '')],
	});

	// splits the coin.
	const feeCoin = txb.splitCoins(txb.gas, [amount]);

	// pays the policy
	txb.moveCall({
		target: `${packageId}::royalty_rule::pay`,
		typeArguments: [itemType],
		arguments: [policyObj, transferRequest, feeCoin],
	});
}

export function resolveKioskLockRule(params: RuleResolvingParams) {
	const {
		transactionBlock: txb,
		packageId,
		itemType,
		kiosk,
		kioskCap,
		policyId,
		purchasedItem,
		transferRequest,
	} = params;

	if (!kiosk || !kioskCap) throw new Error('Missing Owned Kiosk or Owned Kiosk Cap');

	lock(txb, itemType, kiosk, kioskCap, policyId, purchasedItem);

	// proves that the item is locked in the kiosk to the TP.
	txb.moveCall({
		target: `${packageId}::kiosk_lock_rule::prove`,
		typeArguments: [itemType],
		arguments: [transferRequest, objArg(txb, kiosk)],
	});
}

/**
 * A helper to resolve the personalKioskRule.
 * @param params
 */
export function resolvePersonalKioskRule(params: RuleResolvingParams) {
	const { transactionBlock: txb, packageId, itemType, kiosk, transferRequest } = params;

	if (!kiosk) throw new Error('Missing owned Kiosk.');

	// proves that the destination kiosk is personal.
	txb.moveCall({
		target: `${packageId}::personal_kiosk_rule::prove`,
		typeArguments: [itemType],
		arguments: [objArg(txb, kiosk), transferRequest],
	});
}

/**
 * Resolves the floor price rule.
 */
export function resolveFloorPriceRule(params: RuleResolvingParams) {
	const { transactionBlock: txb, packageId, itemType, policyId, transferRequest } = params;

	// proves that the destination kiosk is personal
	txb.moveCall({
		target: `${packageId}::floor_price_rule::prove`,
		typeArguments: [itemType],
		arguments: [objArg(txb, policyId), transferRequest],
	});
}