import xss from 'xss';

export const getAndSanitizeFormData = (req, res) => {
  // Get and sanitize donor name
  const donorName = xss(req.body.name);

  // Get an sanitize donor email
  let donorEmail = req.body.email ? xss(req.body.email) : null;

  // Get donation amount and check if it is a number
  const donationAmount = parseFloat(req.body.amount); // make sure the amount is of type number

  if (isNaN(donationAmount)) {
    let errorTitle = 'Fehler';
    let errorText = 'Der Spendenbetrag muss eine Zahl sein.';
    return res.status(400).render('error', { errorTitle, errorText });
  }

  const positiveAmount = Math.abs(donationAmount); // If the value is negative, convert it to positive
  const truncatedAmount = Math.trunc(positiveAmount); // If the value is a decimal, truncate it

  return {
    donorName,
    donorEmail,
    donationAmount: truncatedAmount,
  };
};
