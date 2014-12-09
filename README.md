Bulletproof Payment Processing for meteor.js
==========================

This package aims to be a fully tested payment processing backbone, with the following features:

1. Save payment tokens in the Meteor.users collection
2. Ensure created transactions include relevant metadata
3. Maintain a record of all created transactions
4. Provide easy to implement guards against over-charging/double-charging/mis-charging

Important notes:
----------------

This package is database operation heavy - we err on the side of too much database interaction rather than too little logging or too few integrity checks.

Basic Operations
==========================

- `Payments.createPaymentMethod(userId, paymentMethod)` - Store a particular payment method on a particular user. This method will ensure that the user has an associated account in the payment processing system and will associate the specified paymentMethod with their account. Should return the id of the newly created paymentMethod.

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
    - **customerTotal** - this check ensures that the amount of the transaction does not push the customer balance over 0 (can be overrided)
    - **orderTotal** - this check narrows the set of examined transactions to include only those relevant to a particular order, to ensure that this transaction does not exceed the amount of that order. (can be overrided)
    - **associatedPaymentMethod** - this check ensures that the payment method in the request actually belongs to the customer in the request.
    - **amountIsInPennies** - this check ensures that the amount is in pennies, most payment systems do not allow fractional pennies, and your amount calculating logic should deal with fractional pennies before attempting to process a transaction.
    - **userExists** - this check ensures that the user who's account is being modified still exists, you generally should not process transactions for user's who's accounts have been deleted. (can be overrided)
    - 

- `Payments.associateCredits(getRecords, getAmounts)` - Registers two functions for calculating the a users current balance.
    - A single call to associateCredits need not be exauhstive. It is perfectly valid and encouraged to register multiple functions for calculating the total amounts due to/from a particular user.
    - `getRecords` is a function `fn(userId)` which should return an array of documents which are relevant to the user in question.
    - `getAmounts` is a function `fn(doc)` which should return an object indicating the amount by which the users balance is decreased by the record in question (`doc`).
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

- `Payments.assocaiteDebits(getRecords, getAmounts)` - Identical to associateCredits this function is used get amounts which a user owes.

- `Payments.associateGuard(guard)` - Registers a function which will be called against all transactions
    + `guard` is a function `fn(transaction)` which will be run against all transactions. Should return a new Meteor.Error for warnings, should throw an error for errors or illegal operations.

- `Payments.associateOrders(name, name, name ...)` - Registers field names which will be used to narrow results when checking orderTotal against transaction amount.

- `Payments.find` - pass through to the underlying transactions collection

- `Payments.findOne` - pass through to the underlying transactions collection

Collections
=========================

The payments package maintains a set of two core collections which it exposes (read-only) on the Payments object:

- `Payments.transactions` - this collection stores each transaction which has been attempted, the payments package keeps these objects up to date with any changes in status (e.g. bank transfers which fail after a few days, pending transactions, etc.) and maintains only one document for every transaction.
- `Payments.logs` - this collection stores a document for every payment server interaction. Most transactions will have one related log entry, but transactions which failed after they were created, or which were created pending will have multiple entries in this collection. All other server to payment server interactions (create customer, create paymentMethod, etc.) will also be recoreded in this collection.

These two collections are stored in mongo under the names 'payments-transactions' and 'payments-logs'.

Both collections share a similar data structure:
```javascript
{
    // Both collections share these fields:

    _id: "Some unique id"
    , providerId: "The unique id of this transaction in the providers db"
    // this should be an id returned by the payment provider which is unique
    // across all requests, generally called a requestId, this id, if provided
    // should be unique across all log entries
    // executorId is null in the case that your server performs updates in
    // the background
    , executorId: "The userId which performed this transaction"
    // userId should never be null, and no transaction should ever have
    // multiple userIds
    , userId: "The userId who's account was affected by this transaction"
    , customerId: "The customerId of the affected user in the providers db"
    // amount should be positive for credits, negative for debits.
    , amount: "The amount of the transaction, null for non-transactions"
    , paymentMethodId: "The id of the payment method to be used"
    // This field exists on both collections but represents the current state
    // for transactions, and the initial state for logs
    // this field should be null if the state is not known, eg a server crash
    // while posting a transaction
    , status: "success|pending|error"

    // These fields are only found in the logs collection:

    , dateStarted: "The timestamp when the request started"
    , dateEnded: "The timestampe when the request completed"
    // A string representing which kind of document was/would have been created
    // or modified as a result of the logged request
    // this field is added because there are multiple ids which might be
    // present even if the related doc was not modified (e.g. customerId)
    , affectedDoc: "transaction|customer|paymentMethod"
    , transactionId: "The _id of the related transaction"
    // this id should be unique across all transactions, customers, and 
    // paymentMethods, it is the id assigned to a record by the payments
    // provider
    , requestId: "The unique id of this server interaction"
    , request: "The request sent to the server, if available"
    , response: "The response received from the server, if avaiable"
    // Error and response should not exist on the same log entry
    , error: "The error thrown/returned by payment processing logic"
    , warnings: "An array of warnings"

    // These fields are only found in the transactions collection:

 // , logId: "An array of _ids for related log entries"
 // // This field is used to store the array of requests which are relevant to
 // // this transaction including any later requests which modify the status of
 // // this transaction, there should be a one to one relationship between
 // // logIds and requestIds (if requestIds are provided)
 // , requestId: "An array of ids representing the requests made to the server"
    , dateCreated: "Timestamp when this transaction was created"
    , dateModified: "Timestamp when this transaction was modified"
}
```

The payments package also maintains two read-write collections for payment methods and customers, also exposed on the Payments object:

- `Payments.paymentMethods` - A collection of all payment methods. Inserts to this collection should be made through the `Payments.createPaymentMethod` method. This collection should be updated in response to changes in user payment preferences (eg user removes a payment method)
- `Payments.customers` - A one to one mapping of Meteor userIds to payment provider customerIds. This collection should be updated in response to changes in user payment preferences (eg user sets payment method as default)

These collections are stored in mongo as you would expect 'payments-paymentMethods' and 'payments-customers';

The payment methods collection has a simple structure:

```javascript
{
    // The id field here is the 'paymentMethodId' returned by
    // Payments.provider.createPaymentMethod and stored in the transactions
    // collection
    _id: "The unique id returned by the payment provider"
    , userId: "Id of the user who owns this payment method"
    , customerId: "Id of the user in the providers db"
    , acceptsDebits: "true if this method accepts debits"
    , acceptsCredits: "true if this method accepts credits"
    , dateCreated: "The date this record was created"
    , dateModified: "The date this record was last modified"
}
```

The customers collection is even simpler:
```javascript
{
    _id: "The unique id returned by the payment provider"
    , userId: "The id of the user represented by this customer doc"
    , defaultPaymentMethodId: "The default payment method to use"
}
```

As you can see the payments system fully contains all the db updates it makes into it's own collections. However if you prefer to store some data in your app collections you can do so using the associate methods:

- `Payments.associateCustomer(callback)` - When a customer record is created callback will be called with the entire customer record as it's first argument. You can use this function to store the customerId or the entire record on your users.
- `Payments.associatePaymentMethod(callback)` - When a paymentMethod record is created callback will be called with the entire paymentMethod record as it's first argument.
- `Payments.associateTransaction(callback)` - When a transaction is created callback will be called with the etnire transaction record as it's first argument.
- `//XXX Payments.associateRequest` - If anyone wants to log a request twice, please issue a pull request implementing this method, I can't think of any good reason for doing this.

Errors
=========================

The payment processing system tries to be consistent in the way that it returns errors. Each Payments method attempts to catch and log errors and then should throw a Meteor.Error with a precise code and readable message.

When available these additional details are included in the error:
```javascript
{
    logId: "The id of the log document which contains further details"
    , internalError: "The error being wrapped, if it was a Meteor.Error"
}
```

Below are listed each error code and corrosponding explenations:
- *transaction-failed* - There was an error and the transaction may or may not have been created.
- *transaction-invalid* - The payment processing system rejected this transaction request as invalid
- *transaction-rejected* - The transaction was created but resulted in an error status from the server (The payment could have been invalid, or could have failed at the payment processing level)
- *create-customer-failed* - There was an error creating the customer object
- *create-paymentMethod-failed* - There was an error creating the paymentMethod object
Payment Provider
======================

This package is designed to work with a payments provider, such as balanced or braintree, to implement a payments provider set the provider object:

```javascript
Payments.provider = {
    // Should take a userId and return a customer object
    createCustomer: function (userId) {
        return new Customer(userId);
    }
    // Should take a customer record (created by createCustomer) and return
    // a paymentMethod object
    , createPaymentMethod: function (customerId, clientToken) {
        return new PaymentMethod(customerId, clientToken);
    }
    // Should take a transaction object {
    //   amount, paymentMethodId, customerId, orderId, etc.
    // }
    // Should return a credit object (or a transaction object)
    , createCredit: function (transaction) {
        return new Credit(transaction.paymentMethodId, transaction.amount);
    }
    // amount will be negative
    , createDebit: function (transaction) {
        return new Debit(transaction.paymentMethodId, transaction.amount);
    }
}
```

On the client the provider object should have only createToken methods:
```javascript
Payments.provider = {
    // Should return a token, token can be a string, or an object, if your
    // system needs to take different actions based on the kind of token then
    // you should return an object, for example: {kind: 'card', token: 'xxxx'}
    // callback is required since client interactions will be asyncronous
    createCardToken: function (card, callback) {
        callback(null, new Card(card));
    }
    , createBankToken: function (bankAccount, callback) {
        callback(null, new BankAccount(bankAccount));
    }
}
```

All provider methods should wrap any asyncronous code in Meteor.wrapAsync, or use fibers to ensure they return syncronously and should return an object in this form:
```javascript
{
    // can be any unique identifier, we use this id for reporting and we pass
    // it into any provider methods which require that id.
    _id: "The transactionId, customerId, paymentMethodId, etc."
    // should be code (success|pending|error) which represents the state of
    // the operation. Returning a status of error will result in an error being
    // thrown by the Payments code.
    , status: "success|pending|error"
    // should be the complete request to the payment processing server, if
    // possible
    , request: "A jsonable object"
    // should be the complete response from the payment processing server, if
    // possible
    , response: "A jsonable object"
    // should be the amount of this transaction
    // negative for debits
    // positive for credits
    , amount: "Amount in cents"
    // if you process the response to determine the error type you can set this
    // field to an Error or Meteor.Error
    , error: "Some Error Object"
    // any other payments supported field which should be stored, for example
    // requestId a unique id per client-server interaction

    // createPaymentMethod should be sure to add flags for acceptsDebits
    // and acceptsCredits, each flag defaults to false. These flags are for use
    // in client side code (e.g. to hide payment methods which are not valid
    // for a particular transaction)
    , acceptsDebits: true
    , acceptsCredits: false

    // createPaymentMethod should be sure to add the following fields for
    // better user experience
    // name is generally the last 4 digits of the cc number plus the brand
    , name: "A short description of the card/bank account"
    , description: "A longer user-readable description of the card"
}
```

If a provider method encounters an error in it's own code it should return an Error object (should be instanceof Error or instanceof Meteor.Error). For example:
```javascript
Payments.provider.createDebit = function (transaction) {
    if (!transaction.paymentMethodId) {
        // Return a Meteor.Error to provide more information to the client
        return new Meteor.Error('missing-payment', 'Missing Payment Method');
    }
};
```

If a provider method encounters an error in it's interaction with the server it should throw an error. For example:
```javascript
Payments.provider.createDebit = function (transaction) {
    var result;
    try {
        // this operation will throw an error if the network connection fails.
        result = HTTP.get(
            'www.payments.com/debits'
            , transaction.paymentMethodId
            , transaction.amount
        );
    } catch (e) {
        throw new Error(e.message);
    }
    return result;
}
```

Provider methods do not need to throw prefixed errors, the payments system will log errors as they are returned and will throw wrapped errors. Something like this:
```javascript
Payments.processError = function (transaction, error) {
    Transactions.update({
        _id: transaction._id
    }, {
        error: error.toString()
    });
    throw new Meteor.Error(
        "transaction-failed"
        , "Transaction processing failed."
    );
}
```


To Do
=========================

1. Handle refunds
2. Handle desputes
3. Provide call-back methods
4. Refactor errors
5. Tests for client side

