const { Restaurant, Category, Comment, User } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const restaurantController = {
  getRestaurants: (req, res) => {
    const DEFAULT_LIMIT = 9
    const categoryId = Number(req.query.categoryId) || ''
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)
    const where = {}
    if (categoryId) where.categoryId = categoryId
    Promise.all([
      Restaurant.findAndCountAll({
        include: Category,
        // where, // 來源: Sequelize的find({where:{categoryId}})
        where: {
          ...categoryId ? { categoryId } : {}
          // 展開運算子順序較低，先進行 categoryId 之三元運算子再展開categoryId結果
        },
        limit,
        offset,
        nest: true,
        raw: true
      }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurants, categories]) => {
        // console.log(restaurants)
        // console.log('----------------------------------------')
        const data = restaurants.rows.map(r => ({
          ...r,
          description: r.description.substring(0, 50)
        }))
        return res.render('restaurants', {
          restaurants: data,
          categories,
          categoryId,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User }
      ]
      // nest: true,
      // raw: true
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist")
        // console.log('--------------here---------------' + restaurant.Comments.text)
        // res.render('restaurant', { restaurant })
        res.render('restaurant', { restaurant: restaurant.toJSON() })
      })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => res.render('feeds', { restaurants, comments }))
      .catch(err => next(err))
  }
}
module.exports = restaurantController
