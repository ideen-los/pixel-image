export const notFoundHandler = (req, res, next) => {
  const errorTitle = '404 Not Found';
  const errorText = 'Die angeforderte Seite wurde nicht gefunden.';

  res.status(404).render('error', { errorTitle, errorText });
};
