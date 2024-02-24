import GlobalFeedPage from '../page-objects/global-feed-page'
import FavoritesApi from '../api-utils/favorites-api'
import ArticleDetailPage from '../page-objects/article-detail-page'
import AuthorApi from '../api-utils/author-api'
import FollowAuthorButton from '../components/follow-author-button'
import { faker } from '@faker-js/faker';
import Comment from '../api-utils/comments-api';

const articleIndex = 0
describe('Checking article detail page', () => {
  before(() => {
    cy.setJwtTokenAsEnv(Cypress.env('email'), Cypress.env('password'))
  })
  beforeEach(() => {
    cy.loginWithSession(Cypress.env('email'), Cypress.env('password'))
    ArticleDetailPage.visit()
  })

  context('Test fav feature', () => {
    before(() => {
      FavoritesApi.unfavoriteArticle()
    })

    it('Give a like to an article', () => {cy.intercept('POST', '**/articles/**/favorite').as('postFavorite')
      GlobalFeedPage.getAmountOfLikes().then(amount => {
        cy.giveLikeToAnArticle()
        cy.wait('@postFavorite').its('response.statusCode').should('eq', 200)
        GlobalFeedPage.getAmountOfLikes().then(newAmount => {
          expect(newAmount).to.eq(amount + 1)
        })
      })
    })
  })

  context('Test add comment feature', () => {
    before(() => {
      Comment.deleteArticleComments(articleIndex)
    })
    it('Add a comment to an article', () => {
      const message = faker.lorem.sentence()
      ArticleDetailPage.sendComment(message)
      ArticleDetailPage.getCommentText()
        .invoke('text')
        .then(text => {
          expect(text.trim()).to.equal(message)
        })
      ArticleDetailPage.getCommentAuthor()
        .invoke('text')
        .then(text => {
          expect(text.trim()).to.equal(Cypress.env("username"))
        })
    })
  })

  context('Test delete article feature', () => {
    const message = faker.lorem.sentence()
    before(() => {
      Comment.addCommentToArticle(articleIndex, message)
    })
    it('Delete an article', () => {
      cy.contains(message).should('exist')
      ArticleDetailPage.deleteComment()
      cy.contains(message).should('not.exist')
    })
  })

  context('Test follow feature', () => {
    before(() => {
      AuthorApi.unfollowAuthor(articleIndex)
    })
    it('Start following an author', function () {
      FollowAuthorButton.getFollowAuthorButton().as('followButton').click()
      cy.get('@followButton').should('contain.text', 'Unfollow')
      cy.get('@followButton').click()
      cy.get('@followButton').should('contain.text', 'Follow')
    })
  })
})