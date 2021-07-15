const makeSumRow = (inputRows, sumRow) => {
  if (!sumRow) {
    sumRow = {}
  }
  if (!sumRow.item_count) {
    sumRow.item_count = 0
  }
  if (!sumRow.turnover) {
    sumRow.turnover = 0
  }
  if (!sumRow.vat_amount) {
    sumRow.vat_amount = 0
  }

  for (let j = 0; j < inputRows.length; j++) {
    sumRow.item_count += inputRows[j].item_count
    sumRow.turnover = sumRow.turnover + inputRows[j].turnover
    sumRow.vat_amount = sumRow.vat_amount + inputRows[j].vat_amount
  }

  return sumRow
}

module.exports = {

  friendlyName: 'Build pdf data rows',

  description: 'Builds data rows for turnover PDF',

  inputs: {

    rows: {
      type: 'ref',
      description: 'The raw turnover data',
      required: true,
    },

  },

  fn: async (inputs, exits) => {

    const membershipTitleRow = {
      isCategoryTitle: true,
      item_type: 'membership',
      name: 'Medlemskaber',
    }

    const membershipRows = _.filter(inputs.rows, ['item_type', 'membership'])

    const membershipSumRow = makeSumRow(membershipRows, {
      name: 'Medlemskaber total',
      item_type: 'membership',
      isSubtotal: true,
    })


    const noShowFeeTitleRow = {
      isCategoryTitle: true,
      item_type: 'membership_no_show_fee',
      name: 'No-show gebyrer',
    }

    const noShowFeeRows = _.filter(inputs.rows, ['item_type', 'membership_no_show_fee'])

    const noShowFeeSumRow = makeSumRow(noShowFeeRows, {
      name: 'No-show gebyrer total',
      item_type: 'membership_no_show_fee',
      isSubtotal: true,
    })

    const membershipPauseFeeTitleRow = {
      isCategoryTitle: true,
      item_type: 'membership_pause_fee',
      name: 'Bero gebyrer',
    }

    const membershipPauseFeeRows = _.filter(inputs.rows, ['item_type', 'membership_pause_fee'])

    const membershipPauseFeeSumRow = makeSumRow(membershipPauseFeeRows, {
      name: 'Bero gebyrer total',
      item_type: 'membership_pause_fee',
      isSubtotal: true,
    })


    const classPassTitleRow = {
      isCategoryTitle: true,
      item_type: 'class_pass_type',
      name: 'Adgangskort',
    }
    const classPassRows = _.filter(inputs.rows, ['item_type', 'class_pass_type'])
    const classPassSumRow = makeSumRow(classPassRows, {
      name: 'Adgangskort total',
      item_type: 'class_pass_type',
      isSubtotal: true,
    })


    const productTitleRow = {
      isCategoryTitle: true,
      item_type: 'product',
      name: 'Varer',
    }
    const productRows = _.filter(inputs.rows, ['item_type', 'product'])
    const productSumRow = makeSumRow(productRows, {
      name: 'Varer total',
      item_type: 'product',
      isSubtotal: true,
    })


    const eventTitleRow = {
      isCategoryTitle: true,
      item_type: 'event',
      name: 'Kurser',
    }
    const eventRows = _.filter(inputs.rows, ['item_type', 'event'])
    const eventSumRow = makeSumRow(eventRows, {
      isSubtotal: true,
      item_type: 'event',
      name: 'Kurser total',
    })

    const giftCardPurchaseTitleRow = {
      isCategoryTitle: true,
      item_type: 'gift_card_purchase',
      name: 'Gavekort købt',
    }
    const giftCardPurchaseRows = _.filter(inputs.rows, {item_type: 'gift_card_purchase'})
    const giftCardPurchaseSumRow = makeSumRow(giftCardPurchaseRows, {
      isSubtotal: true,
      item_type: 'gift_card_purchase',
      name: 'Gavekort købt total',
    })

    const giftCardSpendTitleRow = {
      isCategoryTitle: true,
      item_type: 'gift_card_spend',
      name: 'Gavekort anvendt',
    }
    const giftCardSpendRows = _.filter(inputs.rows, {item_type: 'gift_card_spend'})
    const giftCardSpendSumRow = makeSumRow(giftCardSpendRows, {
      isSubtotal: true,
      item_type: 'gift_card_spend',
      name: 'Gavekort anvendt total',
    })


    const totalRow = makeSumRow([
        membershipSumRow,
        eventSumRow,
        productSumRow,
        classPassSumRow,
        noShowFeeSumRow,
        membershipPauseFeeSumRow,
        giftCardPurchaseSumRow,
        giftCardSpendSumRow,
      ],
      {
        isTotal: true,
        name: 'Total omsætning',
      },
    )


    const rows = [membershipTitleRow]
      .concat(membershipRows)
      .concat([membershipSumRow])

      .concat([noShowFeeTitleRow])
      .concat(noShowFeeRows)
      .concat([noShowFeeSumRow])

      .concat([membershipPauseFeeTitleRow])
      .concat(membershipPauseFeeRows)
      .concat([membershipPauseFeeSumRow])

      .concat([classPassTitleRow])
      .concat(classPassRows)
      .concat([classPassSumRow])

      .concat([eventTitleRow])
      .concat(eventRows)
      .concat([eventSumRow])

      .concat([productTitleRow])
      .concat(productRows)
      .concat([productSumRow])

      .concat([giftCardPurchaseTitleRow])
      //.concat(giftCardPurchaseRows)
      .concat([giftCardPurchaseSumRow])

      .concat([giftCardSpendTitleRow])
      //.concat(giftCardSpendRows)
      .concat([giftCardSpendSumRow])

      .concat([totalRow])

    return exits.success(rows)

  },

}
