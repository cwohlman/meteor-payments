Bulletproof Payment Processing for meteor.js
==========================

This package aims to be a fully tested payment processing backbone, with the following features:
1. Save payment tokens in the Meteor.users collection
2. Ensure created transactions include relevant metadata
3. Maintain a record of all created transactions
4. Provide easy to implement guards against over-charging/double-charging/mis-charging

Basic Operations
==========================

- `Payments.createPaymentMethod(userId, paymentMethod)` - Store a particular payment method on a particular user. This method will ensure that the user has an associated account in the payment processing system and will associate the specified paymentMethod with their account.

- `Payments.createTransaction(transaction, overrideWarnings)` - Takes an object, ensures that the object is a valid transaction request and creates a transaction through the implemented payments provider.
This method goes to a lot of trouble to ensure that the transaction passed in is a valid transaction and hasn't been processed already.
  transaction is an object in the following form:

    ```javascript
    {
        userId: "The user who's account is to be affected"
        , paymentId: "The id of the payment method to be used"
        , amount: "The amount to be charged"
        // amount should be positive for credits
        // amount should be negative for debits
        , kind: "credit" // or "debit"
        // should match the sign of amount
        // acts as a double check against accidentally crediting an account
        // when it should have been debited.

        // transaction should also include any relevant metadata
        // such as orderId, customerId, merchantId, e.g.:
        , orderId: "The id of the order being paid for"
        , customerId, "The 'customerId'"
        , merchantId, "The id of the merchant who fulfilled the order"
        // etc.
    }
    ```

  overrideWarnings is an object, either `{"*":true}` to disregard all warnings, or better:

    ```javascript
    {
        // to disregard warnings with the code 'warningCode':
        "warningCode": true 
    }
    ```

  Performs multiple checks:
    - **customerTotal** - this check ensures that the amount of the transaction does not push the customer balance over 0
    - **orderTotal** - this check narrows the set of examined transactions to include only those relevant to a particular order, to ensure that this transaction does not exceed the amount of that order.

- `Payments.associateCredits(getCredits, getAmounts)` - Registers two functions for calculating the a users current balance.
    - A single call to associateCredits need not be exauhstive. It is perfectly valid and encouraged to register multiple functions for calculating the total amounts due to/from a particular user.
    - `getRecords` is a function `fn(userId)` which should return an array of documents which are relevant to the user in question.
    - `getAmounts` is a function `fn(userId, doc)` which should return an object indicating the amount by which the users balance is decreased by the record in question (`doc`).
      `getAmounts` should not rely on `getRecords` to filter out documents which are not relevant but should instead perform it's own internal check of whether a particular document is relevant to the user in question.
      `getAmounts` should return an object, or array of objects in the following form:
      
      ```javascript
      {
        _id: "The id of the document"
        , amount: "The amount owed to the user"
        // amount may not be negative
        , userId: "The user who's account is affected"
        // any other keys related to this transaction, for example:
        , orderId: "", customerId: "", merchantId: "", //etc...
        // the above keys can be used as part of the orderTotal check.
        // it is recomended that you use keys ending in Id if you wish 
        // to validate them against transactions.
      }
      ```

- `Payments.assocaiteDebits(getDebits, getAmounts)` - Identical to associateCredits this function is used get amounts which a user owes.

- `Payments.associateGuard(guard)` - Registers a function which will be called against all transactions
    + `guard` is a function `fn(transaction)` which will be run against all transactions. Should return a new Meteor.Error for warnings, should throw an error for errors or illegal operations.
- `Payments.find` - pass through to the underlying transactions collection
- `Payments.findOne` - pass through to the underlying transactions collection

