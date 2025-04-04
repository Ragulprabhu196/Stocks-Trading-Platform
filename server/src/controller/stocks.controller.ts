import { Request, Response } from "express";
import User from "../models/user.model";

import {
	fetchStockData,
	searchStocks,
} from "../utils/requests";
import { ITransaction } from "../models/transaction.model";
import { IPosition } from "../models/position.model";
import { AssetType, ENABLED_ASSET_TYPES, isCryptoSymbol } from '../utils/assetTypes';

const getInfo = async (req: Request, res: Response) => {
	/* 
	#swagger.tags = ['Stock Data']
	*/
	const symbol = req.params.symbol;
	const quote = await fetchStockData(symbol);
	res.status(200).send(quote);
};



const buyStock = async (req: Request, res: Response) => {
	/* 
	#swagger.tags = ['Stock Transaction']
	*/
	const symbol = req.params.symbol;
	const quantity = req.body.quantity;

	try {
		const data = await fetchStockData(symbol);
		const price = data.regularMarketPrice;

		let user = await User.findById(req.body.userId);
		user = user!;

		if (user.cash! < price * quantity) {
			res.status(400).send({ message: "Not enough cash" });
		} else {
			user.cash! -= price * quantity;

			// Add sebuyll transaction to ledger
			const transaction: ITransaction = {
				symbol,
				price,
				quantity,
				type: "buy",
				date: Date.now(),
			} as ITransaction;

			user.ledger.push(transaction);

			// Add position to user
			const position = {
				symbol,
				quantity,
				purchasePrice: price,
				purchaseDate: Date.now(),
			} as IPosition;

			user.positions.push(position);

			user
				.save()
				.then((user) => {
					if (user) {
						res.status(200).send({ message: "Stock was bought successfully!" });
					}
				})
				.catch((err) => {
					if (err) {
						res.status(500).send({ message: err });
					}
				});
		}
	} catch (error) {
		console.error("Error fetching " + symbol + " stock data:", error);
		res.status(500).send("Error fetching " + symbol + " stock data:" + error);
	}
};

const sellStock = async (req: Request, res: Response) => {
	/* 
	#swagger.tags = ['Stock Transaction']
	*/
	const symbol = req.params.symbol;
	var quantity = req.body.quantity;

	try {
		const data = await fetchStockData(symbol);
		const price = data.regularMarketPrice;

		let user = await User.findById(req.body.userId);
		user = user!;

		// Check if user has enough shares to sell across all positions
		let quantityOwned = 0;
		user.positions.forEach((position) => {
			if (position.symbol === symbol) {
				quantityOwned += position.quantity;
			}
		});

		if (quantityOwned < quantity) {
			res.status(400).send({ message: "Not enough shares" });
			return;
		}

		user.cash! += price * quantity;

		// Add sell transaction to ledger
		const transaction: ITransaction = {
			symbol,
			price,
			quantity,
			type: "sell",
			date: Date.now(),
		} as ITransaction;

		user.ledger.push(transaction);

		// Sell quantity of shares (decrement for each iteration of the loop) split between all positions of the same symbol
		for (let i = 0; i < user.positions.length; i++) {
			if (user.positions[i].symbol === symbol) {
				if (user.positions[i].quantity > quantity) {
					user.positions[i].quantity -= quantity;
					break;
				} else {
					quantity -= user.positions[i].quantity;
					user.positions.splice(i, 1);
					i--;
				}
			}
		}

		user
			.save()
			.then((user) => {
				if (user) {
					res.send({ message: "Stock was sold successfully!" });
				}
			})
			.catch((err) => {
				if (err) {
					res.status(500).send({ message: err });
				}
			});
	} catch (error) {
		console.error("Error fetching " + symbol + " stock data:", error);
		res.status(500).send("Error fetching " + symbol + " stock data:" + error);
	}
};

const search = async (req: Request, res: Response) => {
	/* 
	#swagger.tags = ['Stock Data']
	*/
	const { query } = req.params;

	if (!query) res.status(400).send({ message: "No query provided" });

	searchStocks(query)
		.then((quotes) => {
			// filter out crypto and only return enabled asset types
			const filteredQuotes = quotes.filter((quote: { quoteType: string, symbol: string }) => {
				const quoteType = quote.quoteType?.toUpperCase();
				return ENABLED_ASSET_TYPES.has(quoteType as AssetType) && 
					   !isCryptoSymbol(quote.symbol);
			});
			res.status(200).send(filteredQuotes);
		})
		.catch((err) => {
			console.log(err);
			res.status(500).send({ message: err });
		});
};

export default { getInfo, buyStock, sellStock, search };
