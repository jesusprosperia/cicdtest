<template>
    <div class="password-reset component">
        <flash-message class="flashpool"></flash-message>
        <div class="reset-form">
            <div class="logo-cont">
                <img class="logo" src="@/assets/logo.png"> 
            </div>
            <h5 class="text-center mb-4">Change Password</h5>
            <b-form @submit="onSubmit">
                <b-form-group 
                    :label="userTrans.new_password + ':'" 
                    label-for="reset-password">
                    <b-form-input
                        id="reset-password"
                        v-model="form.password"
                        type="password"
                        required
                    ></b-form-input>
                </b-form-group>

                <b-form-group 
                    :label="userTrans.confirm_password + ':'"  
                    label-for="confirm-password">
                    <b-form-input
                        id="confirm-password"
                        type="password"
                        v-model="form.confirmPassword"
                        required
                    ></b-form-input>
                </b-form-group>

                <b-button class="w-100 mt-2" variant="outline-success" type="submit">
                    Change
                </b-button>
            </b-form>
        </div>
    </div>
</template>

<script>
import {mapState, mapActions} from 'vuex';

export default {
    name: 'password-reset',
    data () {
        return {
            form: {
                password: '',
                confirmPassword: ''
            }
        }
    },
    computed: {
        ...mapState({
            userTrans: state => state.lang.userTrans
        })
    },
    methods: {
        ...mapActions([
            'changePassword'
        ]),
        onSubmit (evt) {
            evt.preventDefault();

            const {password, confirmPassword} = this.form;

            if (password == confirmPassword) {
                this.changePassword(password)
            } else {
                this.flash('Passwords did not match' , 'error', {timeout: 3000})
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.password-reset {
    margin: auto;
    padding: 30px;
    width: 420px;
    vertical-align: center;
    margin-top: 20px;

    .logo-cont {
        text-align: center;

        .logo {
            width: 80%;
        }
    }

    .reset-form {    
        width: 360px;
    }
}  
</style>
