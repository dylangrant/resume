import {
  concat,
  find,
  intersperse,
  isEmpty,
  isNil,
} from 'rambda'

import { contentGroupTypes } from '../constants'

export const getCopyValues = (editedProducts, product) => {
  if (isEmpty(editedProducts)) return product

  const predicate = item => item.productId === product.productId
  const currentProduct = find(predicate, editedProducts)
  if (!currentProduct) return product

  const copyUpdates = currentProduct.sessionUpdates
  // Find if there are the edited items are for the product
  const title = getTitle(copyUpdates, product)
  const descriptions = getData(copyUpdates, product, contentGroupTypes.DESCRIPTION)
  const metafields = getData(copyUpdates, product, contentGroupTypes.METAFIELDS)

  return {
    ...product,
    descriptions,
    metafields,
    title,
  }
}

export const getTitle = (copyUpdates, product) => !!copyUpdates.title
  ? copyUpdates.title
  : !!product?.title
    ? product.title
    : ""

export const getData = (copyUpdates, product, groupType) => {
  const updatedData = isNil(copyUpdates[groupType])
    ? product[groupType]
    : product[groupType].map(description => {
      const predicate = item => item.productId === description.productId
      const sessionUpdate = find(predicate, copyUpdates[groupType])

      return isNil(sessionUpdate)
        ? description
        : sessionUpdate
    })

  return updatedData
}

export const mapRteNodes = copyBlock => {
  if (isEmpty(copyBlock)) return
  const elements = copyBlock?.elements.map(element => mapChildren(element))

  return {
    ...copyBlock,
    elements,
  }
}

const mapChildren = element => {
  // Need to check this for bullets that don't have a ul
  if (!element?.children) return buildRteText(element)

  const children = isEmpty(element.children)
    ? [{ text: "" }]
    : element.children.map(child => {
      // Because we try to keep the UI consistent until refresh, check for an array - this will be only for <li>'s
      const isArray = Array.isArray(child)

      return isArray
        ? child.map(trueChild => mapChildren(trueChild))
        : !!child?.children
          ? mapChildren(child)
          : buildRteText(child)
    })

  return {
    ...element,
    children,
  }
}

// This is to prevent falsy strings from breaking the RTE
export const buildRteText = item => !!item?.text
  ? item
  : {
    text: "",
  }

export const rteToString = (array, separator = ' ') => {
  const newArray = intersperse(separator, array)

  return newArray.reduce((accum, item) => {
    const newAccum = concat(accum, item)
    return newAccum
  }, '')
}
