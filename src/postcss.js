import parser from 'postcss-selector-parser';

const selectorRegExp = /:has/;

const creator = opts => {
	const preserve = Boolean('preserve' in Object(opts) ? opts.preserve : true);

	return {
		postcssPlugin: 'css-has-pseudo',
		prepare() {
			const ops = [];
			return {
				OnceExit: () => {
					ops.forEach((op) => {
						op();
					});
				},
				Rule: rule => {
					if (!rule.selector || !selectorRegExp.test(rule.selector)) {
						return;
					}

					const modifiedSelector = parser(selectors => {
						selectors.walkPseudos(selector => {
							if (selector.value === ':has' && selector.nodes) {
								const isNotHas = checkIfParentIsNot(selector);
								selector.value = isNotHas ? ':not-has' : ':has';

								const attribute = parser.attribute({
									attribute: encodeURIComponent(String(selector))
									.replace(/%3A/g, ':')
									.replace(/%5B/g, '[')
									.replace(/%5D/g, ']')
									.replace(/%2C/g, ',')
									.replace(/[():%[\],]/g, '\\$&')
								});

								if (isNotHas) {
									selector.parent.parent.replaceWith(attribute);
								} else {
									selector.replaceWith(attribute);
								}
							}
						});
					}).processSync(rule.selector);



					if (preserve) {
						const clone = rule.clone({ selector: modifiedSelector });
						ops.push(() => {
							rule.before(clone)
						});
					} else {
						rule.assign({ selector: modifiedSelector });
					}
				},
			};
		},
	};
};

function checkIfParentIsNot (selector) {
	return Object(Object(selector.parent).parent).type === 'pseudo' && selector.parent.parent.value === ':not';
}

creator.postcss = true

export default creator
